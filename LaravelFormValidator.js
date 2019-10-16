var loaderClass = 'loader-div';
var debug = false;
var showBorderError = true;
var underfieldError = true;
var notifyError = false;
var maxNoty = 1;
var pleaseContactToAdmin = null;
var separateMessage = false;
var csrfToken = $('meta[name="csrf-token"]').attr('content');
var refreshCsrfToken = false;
var csrfTokenUrl = null;
var phpdev = {
    ready: function () {
        //define all events here
        $(document).on('click', 'a', phpdev.dataMethodPost);
        $(document).on('submit', '.ajaxForm', phpdev.submitFormWithValidate);
        $(document).on('change', 'input,textarea,select', phpdev.removeError);
        phpdev.addMetaTag();
    },
    /**
     * @syntax phpdev.setup({params: value})
     * @deprecated Pass the parameter with value in object with given parameter
     * @param   debug(boolean)              As a developer for testing purple it will return database error and any other error that occur when submit the form.
     * @param showBorderError(boolean)      It will show error if validation fail on any input field.
     * @param underfieldError(boolean)      It will show error under the input field in the span tag.
     * @param notifyError(boolean)          This will show a noty popup when if any error occur.
     * @param maxNoty(number)               This will show maximum number of notification at once.
     * @param pleaseContactToAdmin(string)  If debug is false and site is in development but still some error occur then it will show the default message.
     * @param separateMessage(boolean)      If you want to show all message in different different noty then you can set this to true and increase max number of noty from one to higher number.
     * @param loaderClass(string)           When a form is validated by ajax it will take some time this is not good for front end user to wait so if you already have a loader added in your main layout then you can define your own here so the loder will show every time it check the form validation and loader will automatic hide when ajax is complete.
     * @param csrfTokenUrl(string)          If you already added the function from point 4.2 to refresh the token you can define the route here.
     * @param refreshCsrfToken(string)      If you want to refresh csrf token on every fail ajax.
     */
    setup: function (e) {
        if (typeof e !== 'undefined') {
            debug = e.debug ? e.debug : false;//set where to show error in notificatio or under fields
            showBorderError = (e.showBorderError === false) ? false : true; // set this to true to show border in red color
            underfieldError = (e.underfieldError === false) ? false : true; //set it true if you want to show error under field 
            notifyError = e.notifyError ? e.notifyError : false;//set this to true if you want to show error in notify
            maxNoty = e.maxNoty ? e.maxNoty : 1;
            pleaseContactToAdmin = e.defaultErrorMessage ? e.defaultErrorMessage : 'Please contact to admin for more report'; //default error message 
            separateMessage = e.separateMessage ? e.separateMessage : false;
            loaderClass = e.loaderClass ? e.loaderClass : 'loader-div';
            csrfTokenUrl = e.csrfTokenUrl ? e.csrfTokenUrl : null;
            refreshCsrfToken = e.refreshCsrfToken ? e.refreshCsrfToken : false;
        }
    },
    addMetaTag: function () {
        if (!csrfToken) {
            phpdev.rewriteCsrfToken();
        }
    },
    dataMethodPost: function (e) {
        e.preventDefault();
        var getMethod = $(this).data('method');
        if (getMethod != 'post') {
            window.location.href = $(this).attr('href');
        } else {
            ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
            var getCsrfMeta = csrfToken;
            var htmlForm = "<form action='" + $(this).attr('href') + "' method='" + getMethod + "' id='postHrefSubmit'><input type='hidden' name='_token' value='" + getCsrfMeta + "'></form>";
            $(this).parent().append(htmlForm);
            $("#postHrefSubmit").submit();
        }
    },
    submitFormWithValidate: function (e) {
        e.preventDefault();
        var form = $(this);
        (csrfToken) ? form.find('input[name="_token"]').remove() : '';
        ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
        form.find('span.error').remove();
        form.find('input').removeClass('error');
        form.find('select').removeClass('error');
        form.find('textarea').removeClass('error');
        var method = ((typeof form.attr('method') != 'undefined')) ? form.attr('method') : 'get' ;
        var url = form.attr('action');
        //clean the name
        form.find('input,select,textarea').each(function () {
            if ($(this).attr('name') && $(this).attr('name') !== undefined) {
                $(this).attr('name', $(this).attr('name').replace(/'/g, ''));
                $(this).attr('name', $(this).attr('name').replace(/"/g, ''));
            }
        });
        var data = form.serializeArray();
        if (method == 'get') {
            ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
            form.removeClass('ajaxForm');
            form.submit();
        } else {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                }
            });
            $.post(url, data, function (response) {
                if (response.status == true) {
                    if ((typeof response.url != 'undefined') && (response.url != '')) {
                        window.location.href = response.url;
                        return false;
                    }
                    if ((typeof response.message != 'undefined') && (response.message != '')) {
                        phpdev.notify('error', response.message);
                    }
                    ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
                    return true;
                } else if (response.status == false) {
                    if (response.message != '') {
                        phpdev.notify('error', response.message);
                    }
                    ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
                } else {
                    if (debug) {
                        var debugMessage = response;
                        if (typeof response != 'string') {
                            debugMessage = JSON.stringify(response)
                        }
                        phpdev.notify('error', debugMessage);
                    } else {
                        phpdev.notify('error', pleaseContactToAdmin);
                    }
                }
            }).fail(function (response) {
                phpdev.rewriteCsrfToken();
                if (response.responseJSON && response.responseJSON.errors) {
                    var errors = response.responseJSON.errors;
                    var notifyHtml = '';
                    $.each(errors, function (i, e) {
                        //This is for array fields
                        if (i.includes('.')) {
                            var arrayText = i.split('.');
                            var newString = '';
                            $.each(arrayText, function (j, k) {
                                if (j != 0) {
                                    newString += '[' + k + ']';
                                } else {
                                    newString += k;
                                }
                            });
                            i = newString;
                            newString = '';
                        }
                        //this is for array fields end
                        var errorHtml = '<span class="error">' + e[0] + '</span>';
                        (separateMessage) ? phpdev.notify('error', e[0]) : '';
                        notifyHtml += e[0] + '</br>';
                        if (underfieldError) {
                            form.find('input[name="' + i + '"]').parent().append(errorHtml);
                            form.find('select[name="' + i + '"]').parent().append(errorHtml);
                            form.find('textarea[name="' + i + '"]').parent().append(errorHtml);
                        }
                        if (showBorderError) {
                            form.find('input[name="' + i + '"]').addClass('error');
                            form.find('select[name="' + i + '"]').addClass('error');
                            form.find('textarea[name="' + i + '"]').addClass('error');
                        }
                    });
                    //show all column error in notify
                    !separateMessage ? phpdev.notify('error', notifyHtml) : '';
                } else if (response.responseJSON && response.responseJSON.message) {
                    //show all db error in notify
                    if (debug) {
                        phpdev.notify('error', response.responseJSON.message);
                    } else {
                        phpdev.notify('error', pleaseContactToAdmin);
                    }
                } else {
                    phpdev.notify('error', pleaseContactToAdmin);
                }
                return false;
            });
        }
    },
    removeError: function () {
        if ($(this).hasClass('error')) {
            $(this).removeClass('error');
        }
    },
    notify: function (type, message) {
        ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
        type = (type === 'info') ? 'information' : type;
        if (!notifyError) {
            return;
        }
        if (typeof noty === 'undefined') {
            return;
        }
        if (!message) {
            return;
        }
        noty({
            text: message,
            theme: 'relax', // or relax
            type: type, // success, error, warning, information, notification
            maxVisible: maxNoty,
            timeout: 4000,
            closeWith: ['click'],
            animation: {
                open: {height: 'toggle'},
                close: {height: 'toggle'},
                easing: 'swing',
                speed: 500 // opening & closing animation speed
            },
            progressBar: true
        });
    },
    rewriteCsrfToken: function () {
        if (!refreshCsrfToken) {
            return;
        }
        if (!csrfTokenUrl || csrfTokenUrl == null) {
            return;
        }
        $.get(csrfTokenUrl, function (response) {
            if (response.token) {
                csrfToken = response.token;
                ($('meta[name="csrf-token"]').length) ? $('meta[name="csrf-token"]').attr('content', csrfToken) : '';
            }
        }).fail(function () {
            phpdev.notify('error', 'Url Not Found');
        });
    }
};
$(document).ready(phpdev.ready());
/**
 * How to use notify detail
 * @param type success, error, warning, information, notification
 * @param message type your message  
 * 
 * @return {string} this will show you the notification
 **/
function notify(type, message) {
    phpdev.notify(type, message);
}