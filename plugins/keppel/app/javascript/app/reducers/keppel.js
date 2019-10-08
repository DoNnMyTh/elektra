import * as constants from '../constants';

const initialState = {
  accounts: {
    isFetching:  false,
    requestedAt: null,
    receivedAt:  null,
    data:        null,
  },
};

const reqAccts = (state, {requestedAt}) => ({
  ...state,
  accounts: {
    ...initialState.accounts,
    isFetching: true,
    requestedAt,
  },
});

const reqAcctsFail = (state, {}) => ({
  ...state,
  accounts: {
    ...state.accounts,
    isFetching: false,
  },
});

const recvAccts = (state, {data, receivedAt}) => ({
  ...state,
  accounts: {
    ...state.accounts,
    isFetching: false,
    data, receivedAt,
  },
});

export const keppel = (state, action) => {
  if (state == null) {
    state = initialState;
  }

  switch(action.type) {
    case constants.REQUEST_ACCOUNTS:         return reqAccts(state, action);
    case constants.REQUEST_ACCOUNTS_FAILURE: return reqAcctsFail(state, action);
    case constants.RECEIVE_ACCOUNTS:         return recvAccts(state, action);
    default: return state;
  }
};