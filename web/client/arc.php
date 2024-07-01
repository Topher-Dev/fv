<?php
/*
Arc is a lightweight & flexibile api

REQUEST
    c - controller
    s - service
    t - token (Authorized route access)

RESPONSE
    status - == 0 success, > 0 failed
    message - any error message returned by the service
    D - any data returned by the service

Four part sequence notated below

*/

include_once $_SERVER["APP_GIT_ROOT"]."/web/server/token.php";

error_log("[ARC Start] ------------------------------------- Request -------------------------------------");

$app = $_SERVER["APP_NAME"];

//check if we have any command line arguments
$_ARGS = [];
if (isset($argv)) {
    for ($i = 1; $i < $argc; $i++) {
        if (strpos($argv[$i], '--') === 0) {
            list($key, $value) = explode('=', substr($argv[$i], 2));
            $_ARGS[$key] = $value;
        }
    }
}

// 2/4 Gather client data and check if we have a valid arc api call
$data = array_merge($_GET, $_POST, $_ARGS);

// 1/4 get session if exists, else create a new one

$token = new Token($data['token']);
//lock down private routes
$is_validated = false;

//Make sure we have something to validate against
if ($token->validate()) {
    $is_validated = true;
    unset($data["token"]);
} 

if (!$is_validated){
    error_log("AUTH: ACCESS_LEVEL(0)");
}

if (array_key_exists("s", $data) && array_key_exists("m", $data)) {

    $service = $data["s"];
    $method = $data["m"];

    //unset service and controller from D
    unset($data["s"]);
    unset($data["m"]);

    // 3/4 Ensure only those with a valid JWT can access certain services
    $is_service_public = in_array($method, ['test','register','form', 'login', 'initialize', 'email_check'], true);
    $is_service_public =true;
    // 4/4 If we are happy the user can proceed get controller.php file and exectue the chosen service
    if ($is_validated == true || $is_service_public){

        include_once $_SERVER["APP_GIT_ROOT"]. "/web/server/controllers/{$service}.php";

        $c = new $service($token, $data);

        $data_string = preg_replace("!\s+!", " ", print_r($data, true));
        error_log(substr("CALL: CONTROLLER=({$service}) SERVICE=({$method}) D={$data_string}", 0, 8000));

        $c->$method();

    } else {
        $error_msg = "AUTH: User blocked from accessing private service";
        error_log($error_msg);
        echo json_encode([
            "status" => 2,
            "message" => $error_msg
        ]);
    }

} else {
    $error_msg = "AUTH: Incorrectly formated ARC api call, see documentation for details";
    error_log($error_msg);
    echo json_encode([
        "status" => 3,
        "message" => $error_msg
    ]);
}

?>
