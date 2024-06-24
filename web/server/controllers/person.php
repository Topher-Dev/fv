<?php
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/controller.php";

class Person extends Controller {

    public $model_name = "person";
    public $table_name = "person";

    public function test(){
        return $this->success("test complete");
    } 

}
