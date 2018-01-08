((app) ->
  ########################## CLUSTER FORM ###########################
  # TODO: remove hardcoded flavor selection
  initialClusterFormState =
    method: 'post'
    action: ''
    data: {
      name: ''
      spec: {
        nodePools: [
          {
            flavor: 'm1.small'
            image: ''
            name: ''
            size: ''
          }
        ]
        openstack: {}
      }
    }
    isSubmitting: false
    errors: null
    isValid: false
    nodePoolsValid: false
    advancedOptionsVisible: false

  resetClusterForm = (action, {})->
    initialClusterFormState

  updateClusterForm = (state, {name, value}) ->
    data = ReactHelpers.mergeObjects({}, state.data, {"#{name}":value})
    ReactHelpers.mergeObjects({}, state, {
      data: data
      errors: null
      isSubmitting: false
      isValid: (data.name.length > 0 && state.nodePoolsValid)
    })

  updateAdvancedValue = (state, {name, value}) ->
    dataClone = state.data
    dataClone.spec.openstack[name] = value
    ReactHelpers.mergeObjects({},state,{data: dataClone})


  updateNodePoolForm = (state, {index, name, value}) ->
    nodePool = ReactHelpers.mergeObjects({}, state.data.spec.nodePools[index], {"#{name}":value})
    nodePoolsClone = state.data.spec.nodePools.slice(0)
    if index>=0 then nodePoolsClone[index] = nodePool else nodePoolsClone.push nodePool
    stateClone = state
    stateClone.data.spec.nodePools = nodePoolsClone
    poolValidity = nodePool.name.length > 0 && nodePool.size >= 0 && nodePool.flavor.length > 0

    ReactHelpers.mergeObjects(state, stateClone, {
      nodePoolsValid: poolValidity
      isValid: (state.data.name.length > 0 && poolValidity)
    })


  addNodePool = (state, {}) ->
    # TODO: remove hardcoded flavor selection
    newPool = {
                flavor: 'm1.small'
                image: ''
                name: ''
                size: ''
                new: true
              }

    nodePoolsClone = state.data.spec.nodePools.slice(0)
    nodePoolsClone.push newPool
    stateClone = state
    stateClone.data.spec.nodePools = nodePoolsClone
    ReactHelpers.mergeObjects({}, state, stateClone)



  deleteNodePool = (state, {index}) ->
    # remove pool with given index
    nodePoolsFiltered = state.data.spec.nodePools.filter((pool, i) -> parseInt(i,10) != parseInt(index, 10) )
    stateClone = state
    stateClone.data.spec.nodePools = nodePoolsFiltered
    ReactHelpers.mergeObjects({}, state, stateClone)



  submitClusterForm = (state, {})->
    ReactHelpers.mergeObjects({}, state, {
      isSubmitting: true
      errors: null
    })

  prepareClusterForm = (state, {action, method, data})->
    values =
      method: method
      action: action
      errors: null
    values['data'] = data if data

    ReactHelpers.mergeObjects({}, initialClusterFormState,values)

  clusterFormFailure=(state, {errors})->
    ReactHelpers.mergeObjects({}, state, {
      isSubmitting: false
      errors: errors
    })

  toggleAdvancedOptions=(state, {})->
    optionsVisible = state.advancedOptionsVisible
    ReactHelpers.mergeObjects({}, state, {
      advancedOptionsVisible: !optionsVisible
    })

  setClusterFormDefaults = (state, {metaData}) ->
    # set default values in cluster form
    defaults = {}
    # router -> network -> subnet chain
    if metaData.routers?
      router = metaData.routers[0]
      defaults.routerID = router.id

      if router.networks?
        network = router.networks[0]
        defaults.networkID = network.id

        if network.subnets?
          defaults.lbSubnetID = network.subnets[0].id

    # keyPairs
    if metaData.keyPairs?
      defaults.keyPair = metaData.keyPairs[0].name

    # securityGroups
    if metaData.securityGroups?
      defaults.securityGroupID = metaData.securityGroups[0].id

    # ensure already selected values aren't overwritten by the defaults
    dataMerged = ReactHelpers.mergeObjects({},defaults,state.data.spec.openstack)

    stateClone = state
    stateClone.data.spec.openstack = dataMerged
    ReactHelpers.mergeObjects({},state,stateClone)



  app.clusterForm = (state = initialClusterFormState, action) ->
    switch action.type
      when app.RESET_CLUSTER_FORM           then resetClusterForm(state,action)
      when app.UPDATE_CLUSTER_FORM          then updateClusterForm(state,action)
      when app.UPDATE_NODE_POOL_FORM        then updateNodePoolForm(state,action)
      when app.ADD_NODE_POOL                then addNodePool(state,action)
      when app.DELETE_NODE_POOL             then deleteNodePool(state,action)
      when app.SUBMIT_CLUSTER_FORM          then submitClusterForm(state,action)
      when app.PREPARE_CLUSTER_FORM         then prepareClusterForm(state,action)
      when app.CLUSTER_FORM_FAILURE         then clusterFormFailure(state,action)
      when app.FORM_TOGGLE_ADVANCED_OPTIONS then toggleAdvancedOptions(state,action)
      when app.FORM_UPDATE_ADVANCED_VALUE   then updateAdvancedValue(state,action)
      when app.SET_CLUSTER_FORM_DEFAULTS    then setClusterFormDefaults(state,action)
      else state

)(kubernetes)
