<?php

/*
 * This file will be prepended to every php file, make sure only to included app level utility function here
 * and avoid any bloat as it will slow the app down
 */

//load the app config

function app_log(){
    $args = func_get_args();
    $message = implode(" ", $args);
    $message = date("Y-m-d H:i:s")." ".$message.PHP_EOL;
    file_put_contents("app.log", $message, FILE_APPEND);
}


//create a function that will print any data type cleanly to an apache error log

function lg($data) {
    $formattedData = json_encode($data, JSON_PRETTY_PRINT);

    // Log the formatted data to the Apache error log using error_log
    error_log($formattedData);
}


