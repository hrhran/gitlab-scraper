const axios = require('axios');
const moment = require('moment');
const cookieService = require('./cookieService');
const groupService = require('./groupService');
const repoService = require('./repoService');
const testPatternService = require('./testPatternService');
const { logToRenderer } = require('../../logger');

const GITLAB_URL = 'https://gitlab.com';
const GRAPHQL_ENDPOINT = `${GITLAB_URL}/api/graphql`;
const QUERY_LIMIT = 100;

const GRAPHQL_QUERY = `
query getProjectMergeRequestsEE(
  $fullPath: ID!, $sort: MergeRequestSort, $state: MergeRequestState,
  $firstPageSize: Int, $afterCursor: String, $labelName: [String!]
) {
  namespace: project(fullPath: $fullPath) {
    id
    mergeRequests(
      sort: $sort, state: $state, first: $firstPageSize, after: $afterCursor, labelName: $labelName
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        iid
        createdAt
        title
        mergedAt
        webUrl
        diffStatsSummary { additions deletions }
        assignees { nodes { name username avatarUrl } }
      }
    }
  }
}
`;

// Global AbortController for cancellation
let currentAbortController = null;

function normalizeRepoPath(repoPath) {
  try {
    // If repoPath is a full URL, parse it and extract the pathname.
    const urlObj = new URL(repoPath);
    let pathname = urlObj.pathname; // e.g. "/tekion/development/tap/im/be/tap-crm-implementations-backend/"
    return pathname.replace(/^\/|\/$/g, '');
  } catch (error) {
    // Otherwise assume it's already just a path; trim any extra slashes.
    return repoPath.replace(/^\/|\/$/g, '');
  }
}

async function runReport(runParams) {
  try {
    logToRenderer('Starting runReport...');
    const {
      groupId = null,
      repoIds = [],
      startDate,
      endDate,
      labelName = null,
      ticketMode = true,
      mergeRequestType = 'all',
      useFileDiff = false, // We'll force useFileDiff to true from UI, but still keep parameter here
      avoidTest = false
    } = runParams;
  
    const cookieObj = cookieService.getCookie();
    logToRenderer('Cookie: ' + JSON.stringify(cookieObj));
    if (!cookieObj) {
      logToRenderer('No stored cookie found. Please log in.');
      return { error: 'No stored cookie. Please log in.' };
    }
  
    const cookieString = Object.entries(cookieObj)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  
    const startMoment = moment(startDate, 'DD/MM/YYYY');
    const endMoment = moment(endDate, 'DD/MM/YYYY');
    if (!startMoment.isValid() || !endMoment.isValid()) {
      logToRenderer('Invalid start or end date format. Expected DD/MM/YYYY.');
      return { error: 'Invalid start or end date format. Expected DD/MM/YYYY.' };
    }
  
    let targetRepos = [];
    if (groupId) {
      targetRepos = groupService.getReposForGroup(groupId);
    } else if (repoIds && repoIds.length > 0) {
      const allRepos = repoService.getAllRepos();
      targetRepos = allRepos.filter(repo => repoIds.includes(repo.id));
    } else {
      logToRenderer('No repositories specified.');
      return { error: 'No repositories specified.' };
    }
  
    // Initialize our AbortController for cancellation.
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
  
    const finalResults = {
      overall_total: { total_additions: 0, total_deletions: 0 },
      overall_total_excluding_unassigned: { total_additions: 0, total_deletions: 0 },
      user_wise: {}
    };
  
    for (const repo of targetRepos) {
      const normalizedPath = normalizeRepoPath(repo.gitlabPath);
      logToRenderer(`Fetching data for repository: ${normalizedPath}`);
  
      let mergeRequests = await fetchAllMergeRequests({
        repoPath: normalizedPath,
        mergeRequestType,
        labelName,
        cookieString,
        signal
      });
  
      mergeRequests = mergeRequests.filter(mr => {
        const createdAt = moment(mr.createdAt, moment.ISO_8601);
        if (!createdAt.isValid()) return false;
        if (!createdAt.isBetween(startMoment, endMoment, 'seconds', '[]')) {
          return false;
        }
        if (ticketMode && !mr.title.startsWith('#')) {
          return false;
        }
        return true;
      });
  
      if (avoidTest) {
        logToRenderer(`Fetching file diffs for repo: ${normalizedPath}`);
        for (const mr of mergeRequests) {
          try {
            logToRenderer(`Fetching file diff for MR ${mr.iid}...`);
            const { additions, deletions } = await fetchFileDiff({
              repoPath: normalizedPath,
              mrIid: mr.iid,
              cookieString,
              avoidTest,
              signal
            });
            mr.diffStatsSummary.additions = additions;
            mr.diffStatsSummary.deletions = deletions;
          } catch (error) {
            logToRenderer(`Error fetching file diff for MR ${mr.iid} in repo ${normalizedPath}: ${error.message}`);
          }
        }
      }
  
      const { repoStats, userStats, totalAdd, totalDel, totalExcl } = aggregateMRs(mergeRequests);
  
      finalResults[normalizedPath] = repoStats;
      finalResults.overall_total.total_additions += totalAdd;
      finalResults.overall_total.total_deletions += totalDel;
      finalResults.overall_total_excluding_unassigned.total_additions += totalExcl.total_additions;
      finalResults.overall_total_excluding_unassigned.total_deletions += totalExcl.total_deletions;
  
      for (const [userName, stats] of Object.entries(userStats)) {
        if (!finalResults.user_wise[userName]) {
          finalResults.user_wise[userName] = {
            additions: 0,
            deletions: 0,
            avatarUrl: stats.avatarUrl
          };
        }
        finalResults.user_wise[userName].additions += stats.additions;
        finalResults.user_wise[userName].deletions += stats.deletions;
      }
    }
  
    return finalResults;
  } catch (error) {
    logToRenderer('Error in runReport: ' + error.message);
    return { error: error.message };
  } finally {
    currentAbortController = null; // Reset controller after run completes or errors out.
  }
}

async function fetchAllMergeRequests({ repoPath, mergeRequestType, labelName, cookieString, signal }) {
  let results = [];
  let afterCursor = null;
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookieString
  };
  
  while (true) {
    const variables = {
      fullPath: repoPath,
      sort: 'CREATED_DESC',
      state: mergeRequestType,
      firstPageSize: QUERY_LIMIT,
      afterCursor: afterCursor,
      labelName: labelName ? [labelName] : null
    };
  
    try {
      const response = await axios.post(
        GRAPHQL_ENDPOINT,
        { query: GRAPHQL_QUERY, variables },
        { headers, validateStatus: (status) => status < 500, signal }
      );
      
      if (response.status !== 200) {
        logToRenderer(`GraphQL POST response status: ${response.status}`);
        if (response.status === 404) {
          logToRenderer(`Repo not found, please ensure the repo path: ${repoPath}`);
          throw new Error('Repo not found, please ensure the repo path: ' + repoPath);
        } else if (response.status === 302) {
          logToRenderer('Session expired (302 redirect).');
          await cookieService.fetchCookieFromChrome();
          throw new Error('Session expired, please log in again.');
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
      }
  
      const data = response?.data?.data;
      if (!data || !data.namespace) {
        // Fallback: try GET on repoPath
        const repoGet = await axios.get(`${GITLAB_URL}/${repoPath}`, { 
          headers,
          validateStatus: (status) => status < 500,
          signal
        });
        logToRenderer(`GET ${repoPath} status: ${repoGet.status}`);
        if (repoGet.status === 404) {
          logToRenderer(`Repo not found, please ensure the repo path: ${repoPath}`);
          throw new Error('Repo not found, please ensure the repo path: ' + repoPath);
        }
        logToRenderer('Session expired, make sure you\'re logged in.');
        await cookieService.fetchCookieFromChrome();
        throw new Error('Session expired, make sure you\'re logged in');
      }
  
      const mergeRequestsData = data.namespace.mergeRequests;
      const nodes = mergeRequestsData.nodes || [];
      results = results.concat(nodes);
  
      if (!mergeRequestsData.pageInfo.hasNextPage) {
        break;
      }
      afterCursor = mergeRequestsData.pageInfo.endCursor;
    } catch (error) {
      logToRenderer('Error fetching merge requests: ' + error.message);
      throw error;
    }
  }
  return results;
}

async function fetchFileDiff({ repoPath, mrIid, cookieString, avoidTest, signal }) {
  let testPatterns = [];
  if (avoidTest) {
    const patternsData = testPatternService.getAllPatterns();
    testPatterns = patternsData.map(p => p.pattern.toLowerCase());
  }
  const url = `${GITLAB_URL}/${repoPath}/-/merge_requests/${mrIid}/diffs_metadata.json?diff_head=true&view=inline&w=0`;
  const headers = { 'Cookie': cookieString };
  
  try {
    const response = await axios.get(url, { headers, validateStatus: (status) => status < 500, signal });
    const diffData = response.data;
    let fileAdded = 0;
    let fileRemoved = 0;
    if (diffData && Array.isArray(diffData.diff_files)) {
      for (const file of diffData.diff_files) {
        const newPath = (file.new_path || '').toLowerCase();
        if (avoidTest && testPatterns.some(pattern => newPath.includes(pattern))) {
          continue;
        }
        fileAdded += file.added_lines || 0;
        fileRemoved += file.removed_lines || 0;
      }
    }
    return { additions: fileAdded, deletions: fileRemoved };
  } catch (error) {
    logToRenderer(`Error fetching file diff for MR ${mrIid}: ${error.message}`);
    throw error;
  }
}

function aggregateMRs(mrs) {
  const repoStats = {};
  const userStats = {};
  let totalAdd = 0;
  let totalDel = 0;
  const totalExcl = { total_additions: 0, total_deletions: 0 };
  
  mrs.forEach(mr => {
    logToRenderer(`Aggregating: ${mr.title}`);
    let assignees = mr.assignees && mr.assignees.nodes;
    if (!assignees || assignees.length === 0) {
      assignees = [{ name: 'Unassigned', avatarUrl: '' }];
    }

    const additions = Math.floor(mr.diffStatsSummary.additions / assignees.length);
    const deletions = Math.floor(mr.diffStatsSummary.deletions / assignees.length);

    logToRenderer('additions:' + additions + 'deletions:' + deletions);
    logToRenderer('deletions: ' + deletions);
    logToRenderer('assignees: ' + assignees?.length);  
    assignees.forEach(a => {
      totalAdd += additions;
      totalDel += deletions;
      if (!repoStats[a.name]) {
        repoStats[a.name] = { additions: 0, deletions: 0, avatarUrl: a.avatarUrl };
      }
      repoStats[a.name].additions += additions;
      repoStats[a.name].deletions += deletions;
  
      if (!userStats[a.name]) {
        userStats[a.name] = { additions: 0, deletions: 0, avatarUrl: a.avatarUrl };
      }
      userStats[a.name].additions += additions;
      userStats[a.name].deletions += deletions;
  
      if (a.name !== 'Unassigned') {
        totalExcl.total_additions += additions;
        totalExcl.total_deletions += deletions;
      }
    });
  });
  
  return { repoStats, userStats, totalAdd, totalDel, totalExcl };
}

function cancelReportRun() {
  if (currentAbortController) {
    currentAbortController.abort();
    logToRenderer('Report run canceled by user.');
    currentAbortController = null;
  }
}

module.exports = {
  runReport,
  cancelReportRun
};
