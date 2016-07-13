@init_json_editor= () ->
  if $('#jsoneditor').length
    content = ""
    if $('#jsoneditor').data('content-id')
      try
        content = JSON.parse(eval($('#jsoneditor').data('content-id')))
      catch err
        content = eval($('#jsoneditor').data('content-id'))
    else
      content = $('#jsoneditor').data('content')
    options =
      mode: $('#jsoneditor').data('mode'),
      onChange: (event) ->
        $('#forms_automation_chef_attributes').val(editor.getText())
        return

    console.log($('#jsoneditor').data('mode'))
    console.log($('#jsoneditor').data('mode') == "view")
    console.log(jQuery.type(content) == 'undefined' || content == "")

    if !($('#jsoneditor').data('mode') == "view" && (jQuery.type(content) == 'undefined' || content == ""))
      editor = new JSONEditor(document.getElementById('jsoneditor'), options, content);

@init_tag_editor_inputs= () ->
  $('textarea[data-toggle="tagEditor"][data-tageditor-name="environment"]').each ->
    $(this).tagEditor({ placeholder: $(this).attr('placeholder') || 'Enter key value pairs', forceLowercase: false })
  $('textarea[data-toggle="tagEditor"][data-tageditor-name="arguments"]').each ->
    $(this).tagEditor({ placeholder: $(this).attr('placeholder') || 'Enter tags', keyValueEntries: false, forceLowercase: false })
  $('textarea[data-toggle="tagEditor"][data-tageditor-name="runlist"]').each ->
    $(this).tagEditor({ placeholder: $(this).attr('placeholder') || 'Enter tags', keyValueEntries: false, forceLowercase: true })
  $('textarea[data-toggle="tagEditor"][data-tageditor-name="tags"]').each ->
    $(this).tagEditor({ placeholder: $(this).attr('placeholder') || 'Enter tags', keyValueEntries: false, forceLowercase: true })

@switch_automation_type=(event) ->
  value = event.target.value
  if value == 'chef'
    $('#chef-automation').removeClass('hide')
    $('#script-automation').addClass('hide')
  else if value == 'script'
    $('#script-automation').removeClass('hide')
    $('#chef-automation').addClass('hide')

@select_automation_instance=(event) ->
  value = event.target.value
  if value == 'external'
    $('.js-external-instance').removeClass('hide')
  else
    $('.js-external-instance').addClass('hide')

@run_automation_link=(event) ->
  node_id = $(event.target).data('node-id')
  spinner = $('i.loading-spinner-section[data-node-id=' + node_id + ']')
  spinner.removeClass('hide')
  btn_group = $('.btn-group[data-node-id=' + node_id + ']')
  btn_group.addClass('hide')
  $.ajax
    url: $(event.target).data('link'),
    dataType: 'html',
    success: ( data, textStatus, jqXHR ) ->
      $(".flashes").append(data)
    error: () ->
      $(".flashes").append(data)
    complete: () ->
      spinner.addClass('hide')
      btn_group.removeClass('hide')


$ ->
  # add handler to the show modal event
  $(document).on('modal:contentUpdated', init_tag_editor_inputs)
  # add handler to the show modal event
  $(document).on('modal:contentUpdated', init_json_editor)

  # add handler to the automation type select
  $(document).on 'change','select[data-toggle="automationSwitch"]', switch_automation_type

  $(document).on 'change','select[data-toggle="selectAutomationInstance"]', select_automation_instance

  $(document).on 'click','a[data-toggle="run_automation_link"]', run_automation_link

  # init in case the content is not in modal
  init_tag_editor_inputs()

  # init json editor in case not in a modal
  init_json_editor()