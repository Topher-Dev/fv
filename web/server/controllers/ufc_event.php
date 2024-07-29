<?php
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/controller.php";

class Ufc_event extends Controller {

    public $model_name = "ufc_event";
    public $table_name = "ufc_event";

    public function read_one(){
        [ $fmid ] = $this->needs("fmid");

        $db = $this->get_db();

        $event = $db->select_one($this->table_name, "fmid", $fmid);

        return $this->success("read_one", $event);
    }

}
