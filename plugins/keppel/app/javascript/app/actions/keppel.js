import { ajaxHelper } from 'ajax_helper';
import { confirm } from 'lib/dialogs';
import { addError } from 'lib/flashes';
import { ErrorsList } from 'lib/elektra-form/components/errors_list';

import * as constants from '../constants';

const errorMessage = (error) => (
  error.response && error.response.data || error.message
);

/* global React */
const showError = (error) => (
  addError(React.createElement(ErrorsList, {
    errors: errorMessage(error),
  }))
);

////////////////////////////////////////////////////////////////////////////////
// get/set accounts

export const fetchAccounts = () => dispatch => {
  dispatch({
    type: constants.REQUEST_ACCOUNTS,
    requestedAt: Date.now(),
  });

  return ajaxHelper.get('/keppel/v1/accounts')
    .then(response => {
      dispatch({
        type: constants.RECEIVE_ACCOUNTS,
        data: response.data.accounts,
        receivedAt: Date.now(),
      });
    })
    .catch(error => {
      dispatch({ type: constants.REQUEST_ACCOUNTS_FAILURE });
      showError(error);
    });
};

export const fetchAccountsIfNeeded = () => (dispatch, getState) => {
  const state = getState().keppel.accounts;
  if (state.isFetching || state.requestedAt) {
    return;
  }
  return dispatch(fetchAccounts());
};

export const putAccount = account => dispatch => {
  //request body contains account minus name
  const { name, ...accountConfig } = account;
  const requestBody = { account: accountConfig };

  return new Promise((resolve, reject) =>
    ajaxHelper.put(`/keppel/v1/accounts/${name}`, requestBody)
      .then(response => {
        const newAccount = response.data.account;
        dispatch({
          type: constants.UPDATE_ACCOUNT,
          account: newAccount,
        });
        resolve(newAccount);
      })
      .catch(error => reject({ errors: errorMessage(error) }))
  );
};

////////////////////////////////////////////////////////////////////////////////
// get/set peers

export const fetchPeers = () => dispatch => {
  dispatch({
    type: constants.REQUEST_PEERS,
    requestedAt: Date.now(),
  });

  return ajaxHelper.get('/keppel/v1/peers')
    .then(response => {
      dispatch({
        type: constants.RECEIVE_PEERS,
        data: response.data.peers,
        receivedAt: Date.now(),
      });
    })
    .catch(error => {
      dispatch({ type: constants.REQUEST_PEERS_FAILURE });
      showError(error);
    });
};

export const fetchPeersIfNeeded = () => (dispatch, getState) => {
  const state = getState().keppel.peers;
  if (state.isFetching || state.requestedAt) {
    return;
  }
  return dispatch(fetchPeers());
};

////////////////////////////////////////////////////////////////////////////////
// get repositories

const fetchRepositoryPage = (accountName, marker) => dispatch => {
  //send REQUEST_REPOSITORIES only once at the start of the operation
  if (marker == null) {
    dispatch({
      type: constants.REQUEST_REPOSITORIES,
      accountName,
      requestedAt: Date.now(),
    });
  }

  const opts = marker == null ? {} : { marker };
  ajaxHelper.get(`/keppel/v1/accounts/${accountName}/repositories`, opts)
    .then(response => {
      const repos = response.data.repositories;
      dispatch({
        type: constants.RECEIVE_REPOSITORIES,
        accountName,
        data: repos,
        receivedAt: Date.now(),
      });
      if (response.data.truncated) {
        fetchRepositoryPage(accountName, repos[repos.length-1].name);
      } else {
        dispatch({
          type: constants.REQUEST_REPOSITORIES_FINISHED,
          accountName,
          receivedAt: Date.now(),
        });
      }
    })
    .catch(error => {
      dispatch({
        type: constants.REQUEST_REPOSITORIES_FAILURE,
        accountName,
      });
      showError(error);
    });
};

export const fetchRepositoriesIfNeeded = (accountName) => (dispatch, getState) => {
  const state = getState().keppel.repositoriesFor[accountName] || {};
  if (state.isFetching || state.requestedAt) {
    return;
  }
  return dispatch(fetchRepositoryPage(accountName, null));
};

export const deleteRepository = (accountName, repoName) => dispatch => {
  return new Promise((resolve, reject) =>
    ajaxHelper.delete(`/keppel/v1/accounts/${accountName}/repositories/${repoName}`)
      .then(() => {
        dispatch({
          type: constants.DELETE_REPOSITORY,
          accountName, repoName,
        });
        resolve();
      })
      .catch(error => {
        showError(error);
        reject();
      })
  );
};
////////////////////////////////////////////////////////////////////////////////
// get manifests

const fetchManifestPage = (accountName, repoName, marker) => dispatch => {
  //send REQUEST_MANIFESTS only once at the start of the operation
  if (marker == null) {
    dispatch({
      type: constants.REQUEST_MANIFESTS,
      accountName, repoName,
      requestedAt: Date.now(),
    });
  }

  const opts = marker == null ? {} : { marker };
  ajaxHelper.get(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_manifests`, opts)
    .then(response => {
      const manifests = response.data.manifests;
      dispatch({
        type: constants.RECEIVE_MANIFESTS,
        accountName, repoName,
        data: manifests,
        receivedAt: Date.now(),
      });
      if (response.data.truncated) {
        fetchManifestPage(accountName, repoName, manifests[manifests.length-1].name);
      } else {
        dispatch({
          type: constants.REQUEST_MANIFESTS_FINISHED,
          accountName, repoName,
          receivedAt: Date.now(),
        });
      }
    })
    .catch(error => {
      dispatch({
        type: constants.REQUEST_MANIFESTS_FAILURE,
        accountName, repoName,
      });
      showError(error);
    });
};

export const fetchManifestsIfNeeded = (accountName, repoName) => (dispatch, getState) => {
  const state = (getState().keppel.manifestsFor[accountName] || {})[repoName] || {};
  if (state.isFetching || state.requestedAt) {
    return;
  }
  return dispatch(fetchManifestPage(accountName, repoName, null));
};

export const deleteManifest = (accountName, repoName, digest, tagName) => (dispatch, getState) => {
  //when `tagName` is non-empty, the user has selected this tag for deletion,
  //and we should ask for confirmation before deleting the manifest if it is
  //also referenced by other tags
  const otherTagNames = (() => {
    if (!tagName) {
      return [];
    }
    const manifestsForAccount = getState().keppel.manifestsFor[accountName] || {};
    const manifestsForRepo = manifestsForAccount[repoName] || {};
    const manifestInfo = (manifestsForRepo.data || []).find(m => m.digest === digest) || {};
    const manifestTags = manifestInfo.tags || [];
    return manifestTags.map(t => t.name).filter(n => n != tagName);
  })();

  return new Promise((resolve, reject) => {
    const precondition = otherTagNames.length == 0
      ? Promise.resolve(null)
      : confirm(`Really delete this image? It is also tagged as ${otherTagNames.map(n => `"${n}"`).join(', ')} and those tags will be deleted as well.`);

    precondition.then(() =>
      ajaxHelper.delete(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_manifests/${digest}`)
        .then(() => {
          dispatch({
            type: constants.DELETE_MANIFEST,
            accountName, repoName, digest,
          });
          resolve();
        })
        .catch(error => {
          showError(error);
          reject();
        })
    ).catch(() => reject());
  });
};
