import { connect } from  'react-redux';
import AccountCreateModal from '../../components/accounts/create';
import { putAccount } from '../../actions/keppel';

export default connect(
  state => ({
    existingAccountNames: (state.keppel.accounts.data || []).map(a => a.name),
    peerHostNames:        (state.keppel.peers.data    || []).map(p => p.hostname),
  }),
  dispatch => ({
    putAccount: (...args) => dispatch(putAccount(...args)),
  }),
)(AccountCreateModal);
