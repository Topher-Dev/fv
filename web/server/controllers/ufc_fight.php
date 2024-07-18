<?php
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/controller.php";

class Ufc_fight extends Controller {

    public $model_name = "ufc_fight";
    public $table_name = "ufc_fight";

    public function read_one(){
        [ $fight_fmid ] = $this->needs("fight_fmid");

        $db = $this->get_db();

        $fight = $db->select_one($this->table_name, "fmid", $fight_fmid);

        return $this->success("read_one", $fight);
    }

}
