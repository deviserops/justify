var loaderClass = 'loader-div';
var debug = false;
var showBorderError = true;
var underfieldError = true;
var justifyError = false;
var pleaseContactToAdmin = null;
var separateMessage = false;
var csrfToken = $('meta[name="csrf-token"]').attr('content');
var refreshCsrfToken = false;
var csrfTokenUrl = null;
var justifyLocalStorage = 'justify_noty_message';
var customJustify = null;
var ajaxTimeout = 0;
var errorClass = {
    'field': 'is-invalid',
    'span': 'invalid-feedback',
    'attr': 'role="alert"'
}
var justify = {
    ready: function () {
        //define all events here
        $(document).on('click', 'a', justify.dataMethodPost);
        $(document).on('submit', '.ajaxForm', justify.submitFormWithValidate);
        $(document).on('change', 'input,textarea,select', justify.removeError);
        justify.addMetaTag();
        justify.justifyNotyMessage();
        justify.checkHrefHash();
    },
    /**
     * @syntax justify.setup({params: value})
     * @deprecated Pass the parameter with value in object with given parameter
     * @param   debug(boolean)              As a developer for testing purple it will return database error and any other error that occur when submit the form.
     * @param showBorderError(boolean)      It will show error if validation fail on any input field.
     * @param underfieldError(boolean)      It will show error under the input field in the span tag.
     * @param justifyError(boolean)          This will show a noty popup when if any error occur.
     * @param defaultErrorMessage(string)   If debug is false and site is in development but still some error occur then it will show the default message.
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
            justifyError = e.justifyError ? e.justifyError : false;//set this to true if you want to show error in notify
            pleaseContactToAdmin = e.defaultErrorMessage ? e.defaultErrorMessage : 'Please contact to admin for more report'; //default error message
            separateMessage = e.separateMessage ? e.separateMessage : false;
            loaderClass = e.loaderClass ? e.loaderClass : 'loader-div';
            csrfTokenUrl = e.csrfTokenUrl ? e.csrfTokenUrl : null;
            refreshCsrfToken = e.refreshCsrfToken ? e.refreshCsrfToken : false;
            customJustify = e.customJustify ? e.customJustify : null;
            ajaxTimeout = e.ajaxTimeout ? e.ajaxTimeout : 0;
        }
        justify.rewriteCsrfToken();
    },
    addMetaTag: function () {
        if (!csrfToken) {
            justify.rewriteCsrfToken();
        }
    },
    checkHrefHash: function () {
        var getHref = $(document).find('a');
        getHref.each(function (i, e) {
            if (($(e).attr('href') == '#') || ($(e).attr('href') == 'undefined') || ($(e).attr('href') == undefined) || ($(e).attr('href') == '')) {
                $(e).attr('href', 'javascript:void(0)');
            }
        });
    },
    dataMethodPost: function (e) {
        var getMethod = $(this).data('method');
        var getClass = $(this).data('class');
        if (getMethod != 'post') {
            return true;
        } else {
            e.preventDefault();
            var getConfirmMessage = $(this).data('confirm-message');
            if (getConfirmMessage && typeof getConfirmMessage != 'undefined') {
                if (!confirm(getConfirmMessage)) {
                    return false;
                }
            }
            ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
            var getCsrfMeta = csrfToken;
            var htmlForm = "<form action='" + $(this).attr('href') + "' method='" + getMethod + "' id='postHrefSubmit' class='" + getClass + "'><input type='hidden' name='_token' value='" + getCsrfMeta + "'></form>";
            $(document).find('#postHrefSubmit').remove();
            $(this).parent().append(htmlForm);
            $("#postHrefSubmit").submit();
        }
    },
    submitFormWithValidate: function (e) {
        e.preventDefault();
        var form = $(this);
        (csrfToken) ? form.find('input[name="_token"]').remove() : '';
        ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
        form.find('span.' + errorClass.span).remove();
        form.find('input').removeClass(errorClass.field);
        form.find('select').removeClass(errorClass.field);
        form.find('textarea').removeClass(errorClass.field);
        var method = ((typeof form.attr('method') != 'undefined')) ? form.attr('method') : 'get';
        var url = form.attr('action');
        //clean the name
        form.find('input,select,textarea').each(function () {
            if ($(this).attr('name') && $(this).attr('name') !== undefined) {
                $(this).attr('name', $(this).attr('name').replace(/'/g, ''));
                $(this).attr('name', $(this).attr('name').replace(/"/g, ''));
            }
        });
        var data = new FormData(this);
        if (method.toLowerCase() !== 'post') {
            ($('.' + loaderClass).length) ? $('.' + loaderClass).show() : '';
            form.removeClass('ajaxForm');
            form.submit();
        } else {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
                'contentType': false,
                'processData': false,
                'timeout': ajaxTimeout
            });
            $.post(url, data, function (response) {
                if (response.status == true) {
                    if ((typeof response.url != 'undefined') && ($.trim(response.url) != '') && (response.url != null)) {
                        if ((typeof response.message != 'undefined') && ($.trim(response.message) != '') && (response.message != null)) {
                            localStorage.setItem(justifyLocalStorage, $.trim(response.message));
                        }
                        window.location.href = response.url;
                        return false;
                    } else {
                        if ((typeof response.message != 'undefined') && ($.trim(response.message) != '') && (response.message != null)) {
                            justify.notify('info', $.trim(response.message));
                        }
                        if ((typeof response.function != 'undefined') && ($.trim(response.function) != '') && (response.function != null)) {
                            var fnName = $.trim(response.function);
                            if (fnName) {
                                var subFnNames = fnName.split('.')
                                var param = null;
                                if ((typeof response.data != 'undefined') && (response.data != '')) {
                                    param = response.data;
                                }
                                justify.callDynamicFn(subFnNames, param)
                            }
                        }
                    }
                    ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
//                    return true;
                } else if (response.status == false) {
                    if (response.message != '') {
                        justify.notify('error', response.message);
                    }
                    ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
                } else {
                    if (debug) {
                        var debugMessage = response;
                        if (typeof response != 'string') {
                            debugMessage = JSON.stringify(response)
                        }
                        justify.notify('error', debugMessage);
                    } else {
                        justify.notify('error', pleaseContactToAdmin);
                    }
                }
                justify.checkHrefHash();
            }).fail(function (response) {
                justify.rewriteCsrfToken();
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
                        var errorHtml = '<span class="' + errorClass.span + '">' + e[0] + '</span>';
                        (separateMessage) ? justify.notify('error', e[0]) : '';
                        notifyHtml += e[0] + '</br>';
                        if (underfieldError) {
                            form.find('input[name="' + i + '"]').parent().append(errorHtml);
                            form.find('select[name="' + i + '"]').parent().append(errorHtml);
                            form.find('textarea[name="' + i + '"]').parent().append(errorHtml);
                        }
                        if (showBorderError) {
                            form.find('input[name="' + i + '"]').addClass(errorClass.field);
                            form.find('select[name="' + i + '"]').addClass(errorClass.field);
                            form.find('textarea[name="' + i + '"]').addClass(errorClass.field);
                        }
                    });
                    //show all column error in notify
                    !separateMessage ? justify.notify('error', notifyHtml) : '';
                } else if (response.responseJSON && response.responseJSON.message) {
                    //show all db error in notify
                    if (debug) {
                        justify.notify('error', response.responseJSON.message);
                    } else {
                        justify.notify('error', pleaseContactToAdmin);
                    }
                } else {
                    justify.notify('error', pleaseContactToAdmin);
                }
                justify.checkHrefHash();
                return false;
            });
        }
    },
    callDynamicFn: function (subFn, param, callable = null) {
        $.each(subFn, function (fnK, fnV) {
            // console.log(typeof fnV);
            if (typeof fnV == 'string') {
                callable = (callable != null) ? callable[fnV] : window[fnV];
            }
            if (fnK + 1 == subFn.length) {
                callable(param)
            }
        });
    },
    justifyNotyMessage: function () {
        var getMessage = localStorage.getItem(justifyLocalStorage);
        if ((typeof getMessage != 'undefined') && (getMessage != '') && getMessage != null) {
            setTimeout(function () {
                justify.notify('info', getMessage);
                localStorage.removeItem(justifyLocalStorage);
            }, 1500);
        }
    },
    removeError: function () {
        if ($(this).hasClass(errorClass.field)) {
            $(this).removeClass(errorClass.field);
        }
    },
    notify: function (type, message) {
        ($('.' + loaderClass).length) ? $('.' + loaderClass).hide() : '';
        type = (type === 'info') ? 'information' : type;
        if (!justifyError) {
            return;
        }
        if (!message) {
            return;
        }
        if (customJustify && (typeof customJustify == 'function')) {
            customJustify(type, message);
        } else {
            return;
        }
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
                $('form').each(function (i, e) {
                    $(e).find('input[name="_token"]').val(csrfToken);
                })
            }
        }).fail(function () {
            justify.notify('error', 'Url Not Found');
        });
    }
};
$(document).ready(justify.ready());