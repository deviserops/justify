# Laravel Form Validator

This library used to validate the form with ajax and verify the form data based on request validation.

# Dependency:
1. JQuery (Required)
2. Noty.js (Optional)
3. Add Csrf-token in header of your html page (Required any 1 of these two);
	- Add meta tag to your header
    ```
	<meta name="csrf-token" content="{{ csrf_token() }}">
    ```
   
	- If you want to refresh your csrf token after every request then create a route with below function that return your csrf token dynamic if any request crash, dump or fail when debugging code
    ```
	public function refreshToken() {
	  session()->regenerate();
	  return response()->json([
	    "message" => 'Token Refreshed',
	    "token" => csrf_token()], 200);
	}

    ```
4. After validate the form in your controller use this return function:

    ```
    /**
     * Send return response when Ajax call on form submit
     * 
     * @param boolean   $status    This will be true or false.
     * @param string    $url       This is the page Url where to redirect after form submit successfully.
     * @param string    $message   This is to show message on error.
     * @param array     $data      Just in case if you want to send some data in return.
     * @param array     $function  This function will call in javascript like function(param) (this is your custom function and param will be data you return).
     * @return array    This will return all param detail with array.
     * 
     * */
    public function sendResponse($status, $url = '', $message = '', $data = [], $function = '') {
        return [
            'status' => $status,
            'url' => $url,
            'message' => $message,
            'data' => $data,
            'function' => $function
        ];
    }
    ```
    (Recommended to use upper code in parent controller and call a function like following code):
    ```
    return $this->sendResponse($status, $url, $message, $data, $function)
    ```

# Uses:
1. Add validate.js to your header.
2. setup library
    ```
    phpdev.setup({
        underfieldError: false,
        showBorderError: true,
        refreshCsrfToken: true,
        csrfTokenUrl: 'refreshToken', //this must be full url
        notifyError: true
    });
    ```
3. Add class ```ajaxForm``` to form tag.
3. done.

# Additional Feature:
### Use Href tag ```<a href="">``` as a POST
     1. Set attribute for post request
        
        ```data-method="post"```
     2. Ask Confirm before process.
        
        ```data-confirm-message```
     3. For Ajax submit
        
        ```data-class="ajaxForm"```
        
### Full Example
     
    ```
    <a href="yourUrl" data-confirm-message="enter your message here" data-method="post" data-class="ajaxForm">Click me</a>
    ```

# Advantage
 1. It can also validate laravel array value for validator.
 2. Validate over href tag.
 3. No custom js validation or html validation required, it will direct validate from laravel request.
 4. If you leave ```href``` empty in a tag it will add ```javascript:void(0)``` to prevent unwanted click.

# Disadvantages
 1. It cannot Submit file if there is file input in the form, you can add file name just like any input field. It will only send file name.


# Plugin Options:

```
Param                               Default                             Description

debug                               false                                   As a developer for testing purpose it will return database error and any other error that occur when submit the form.
showBorderError                     true                                    It will show error if validation fail on any input field.
underfieldError                     true                                    It will show error under the input field in the span tag
notifyError                         false                                   This will show a noty popup when if any error occur
maxNoty                             1                                       This will show maximum number of notification at once
defaultErrorMessage                 'Please contact admin for more info'    If debug is false and site is in development but still some error occur then it will show the default message
separateMessage                     false                                   If you want to show all message in different different noty then you can set this to true and increase max number of noty from one to higher number.
loaderClass                         'loader-div'                            When a form is validated by ajax it will take some time this is not good for front end user to wait so if you already have a loader added in your main layout then you can define your own here so the loder will show every time it check the form validation and loader will automatic hide when ajax is complete.
csrfTokenUrl                        null                                    If you already added the function from point 4.2 to refresh the token you can define the route here.
refreshCsrfToken                    false                                   If you want to refresh csrf token on every fail ajax.
```
