import * as constants from '../constants';
import { ajaxHelper } from 'ajax_helper';
import { confirm } from 'lib/dialogs';
import { addNotice, addError } from 'lib/flashes';

import { ErrorsList } from 'lib/elektra-form/components/errors_list';

//################### PORTS #########################
const requestPorts= () =>
  ({
    type: constants.REQUEST_PORTS,
    requestedAt: Date.now()
  })
;

const requestPortsFailure= () => ({type: constants.REQUEST_PORTS_FAILURE});

const receivePorts= (json, hasNext) =>
  ({
    type: constants.RECEIVE_PORTS,
    ports: json,
    hasNext,
    receivedAt: Date.now()
  })
;

const requestPort= id =>
  ({
    type: constants.REQUEST_PORT,
    id,
    requestedAt: Date.now()
  })
;

const requestPortFailure= id =>
  ({
    type: constants.REQUEST_PORT_FAILURE,
    id
  })
;

const receivePort= json =>
  ({
    type: constants.RECEIVE_PORT,
    port: json
  })
;

const fetchPorts= (page=null) =>
  function(dispatch,getState) {
    dispatch(requestPorts());

    return ajaxHelper.get('/', {params: { page } }).then( (response) => {
      if (response.data.errors) {
        addError(React.createElement(ErrorsList, {errors: response.data.errors}))
      } else {
        dispatch(receivePorts(response.data.ports, response.data.has_next));
      }
    })
    .catch( (error) => {
      dispatch(requestPortsFailure());
      addError(`Could not load ports (${error.message})`)
    });
  }
;

const loadNext= () =>
  function(dispatch, getState) {
    let state = getState();

    if(!state.ports.isFetching && state.ports.hasNext) {
      dispatch(fetchPorts(state.ports.currentPage+1)).then(() => {
        // load next if search modus (searchTerm is presented)
        dispatch(loadNextOnSearch(state.ports.searchTerm))
      })
    }
  }
;

const loadNextOnSearch=(searchTerm) =>
  function(dispatch) {
    if(searchTerm && searchTerm.trim().length>0) {
      dispatch(loadNext());
    }
  }
;

const setSearchTerm= (searchTerm) =>
  ({
    type: constants.SET_SEARCH_TERM,
    searchTerm
  })

const searchPorts= (searchTerm) =>
  function(dispatch) {
    dispatch(setSearchTerm(searchTerm))
    dispatch(loadNextOnSearch(searchTerm))
  }
;

const shouldFetchPorts= function(state) {
  if (state.ports.isFetching || state.ports.requestedAt) {
    return false;
  } else {
    return true;
  }
};

const fetchPortsIfNeeded= () =>
  function(dispatch, getState) {
    if (shouldFetchPorts(getState())) { return dispatch(fetchPorts()); }
  }
;

const requestDelete= id =>
  ({
    type: constants.REQUEST_DELETE_PORT,
    id
  })
;

const deletePortFailure=id =>
  ({
    type: constants.DELETE_PORT_FAILURE,
    id
  })
;

const removePort=id =>
  ({
    type: constants.DELETE_PORT_SUCCESS,
    id
  })
;

const deletePort= id =>
  function(dispatch, getState) {

    confirm(`Do you really want to delete the port ${id}?`).then(() => {
      dispatch(requestDelete(id));
      ajaxHelper.delete(`/${id}`).then((response) => {
        if (response.data && response.data.errors) {
          addError(React.createElement(ErrorsList, {errors: response.data.errors}));
          dispatch(deletePortFailure(id))
        } else {
          dispatch(removePort(id));
        }
      }).catch((error) => {
        dispatch(deletePortFailure(id))
        addError(React.createElement(ErrorsList, {errors: error.message}));
      })
    }).catch((aborted) => null)
  }
;

//################ PORT FORM ###################
const submitNewPortForm= (values) => (
  (dispatch) =>
    new Promise((handleSuccess,handleErrors) =>
      ajaxHelper.post('/', { port: values }
      ).then((response) => {
        if (response.data.errors) handleErrors({errors: response.data.errors});
        else {
          dispatch(receivePort(response.data))
          handleSuccess()
        }
      }).catch(error => handleErrors({errors: error.message}))
    )
);

export {
  fetchPortsIfNeeded,
  deletePort,
  submitNewPortForm,
  searchPorts,
  loadNext
}
