<?php
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/controller.php";
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/user.php";

/*Clients first action is to authenticate who is visiting our App, it 
1) Checks if token exists in local storage => if its expired

*/
class Auth extends Controller
{   

    public $model_name = "person";
    public $table_name = "person";

    public function initialize(){

        #Get the next upcoming ufc_event record
        $db = $this->get_db();
        $upcoming_event = $db->find_one("ufc_event", "where main_card > now() order by main_card asc limit 1");

        if (!is_null($this->user)){
            return $this->success("Authenticated", [
                "user" => $this->user->dump(),
                "is_authenticated" => true,
                "upcoming_event" => $upcoming_event
            ]);
        } else {
            #refactor the above for less code
            $user_items = ['REMOTE_ADDR', 'HTTP_USER_AGENT', 'HTTP_REFERER', 'REQUEST_URI', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED_HOST', 'HTTP_X_FORWARDED_SERVER'];
            $user = [];
            foreach ($user_items as $ui){
                if (isset($_SERVER[$ui])){
                    $user[strtolower($ui)] = $_SERVER[$ui];
                }
            }

            return $this->success("Not Authenticated", [
                "user" => $user,
                "is_authenticated" => false,
                "upcoming_event" => $upcoming_event
            ]);
        }
    }

    public function email_check(){

        $this->needs("email");
        $db = $this->get_db();

        //lowercase the email
        $address = strtolower($this->data["email"]);

        $email = $db->find_one(
            "person", 
            "where email=:email", 
            ["email" => $address]
        );

        if ($email){
            $this->success("Email Found");
        } else {
            $this->error("Email Not Found");
        }
    }

    public function register()
    {   
        $user_data = array_merge($this->data, [
            "activation_code" => md5($this->data['email'].time()),
            "password" => password_hash($this->data["password"], PASSWORD_DEFAULT)
        ]);

        json_encode($user_data);

        $m = $this->get_model("register");

        $new_user = $m->build($user_data);

        if (!$new_user->create_one()){
            return $this->error("Failed to register new user", $new_user->dump());
        };

        $this->success("Registration Successful", $new_user->response());
    }

    public function login()
    {
        $m = $this->get_model("login");

        $user = $m->build($this->data);
        $errors=[];

        if (!$user){
            return $this->error("Failed to build user", $m->dump());
        }

        //read the values from a view instead of the table
        $read_options = [ "view" => "usertree" ];

        //Check if we have a valid record
        if (!$user->read_one($read_options)){
            return $this->error("Invalid Email", [ "email" => "No user registered with given email" ]);
        }

        if (password_verify($this->data["password"], $user->get_field("person_password"))){
            //change to role_name
            $token = $this->token->issue(
                $user->get_field("id"),
                $user->get_field("role_name"),
                $user->get_field("company_id")
            );

            $this->user = new User($user->get_field("id"), $this->db);

            return $this->success("Login Sucessful", [ 
                "departments" => $this->get_department_tree($this->user->get_branches()),
                "user" => $this->user->dump(),
                "token" => $token
            ]);
        } else {

            //update the failed login count
            $user->update_one(["failed_login_attempts" => $user->get_field("failed_login_attempts") + 1]);
            return $this->error("Invalid password", [ "password" => "Incorrect user password!" ]);
        }
    }

    public function logout()
    {
        // session_destroy();
        return $this->success("Logged out");
    }

    public function change_password() {

        [   
            $id,
            $old_password,
            $new_password,
            $confirm_password
        ] = $this->needs("id,current-password,new-password,confirm-password");

        $db = $this->get_db();

        $person = $db->select_one("person", "id", $id);
        
        if (!$person){
            return $this->error("Failed to find user");
        }

        if (!password_verify($old_password, $person['password'])){
            return $this->error("Invalid password");
        }

        if ($new_password != $confirm_password){
            return $this->error("Passwords do not match");
        }

        $new_password = password_hash($new_password, PASSWORD_DEFAULT);

        if ($db->update_one("person", "id", $id, ["password" => $new_password])){
            return $this->success("Password changed");
        }

        
    }
}
