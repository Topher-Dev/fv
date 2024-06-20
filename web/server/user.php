<?php

class User {
    public $id;
    public $organization_id;
    public $organization_name;
    public $company_id;
    public $company_name;
    public $role_id;
    public $role_name;
    public $person_first_name;
    public $person_last_name;
    public $person_email;
    public $person_phone;
    public $branches;
    public $departments;

    public function __construct($user_id, $db) {
        
        $u = $db->select_one("usertree", "id", $user_id);

        $this->id = $user_id;
        $this->organization_id = $u['organization_id'];
        $this->organization_name = $u['organization_name'];
        $this->company_id = $u['company_id'];
        $this->company_name = $u['company_name'];
        $this->role_id = $u['role_id'];
        $this->role_name = $u['role_name'];
        $this->person_first_name = $u['person_first_name'];
        $this->person_last_name = $u['person_last_name'];
        $this->person_full_name = $u['person_first_name'] . " " . $u['person_last_name'];
        $this->person_email = $u['person_email'];
        $this->person_phone = $u['person_phone'];
        $this->branches = json_decode($u['branches'], true);
        $this->departments = json_decode($u['departments'], true);
        //$this->preferences = json_decode($u['person_preferences'], true);

    }

    public function has_department($department_name) {
        foreach ($this->departments['list'] as $d) {
            if ($d['name'] == $department_name) {
                return true;
            }
        }

        return false;
    }

    public function has_permission($role_name) {
        error_log("Checking if user has permission: " . $role_name);
        error_log("User role: " . $this->role_name);
        return ($this->role_name == $role_name);
    }

    public function has_branch($branch_id) {
        // Add implementation logic here
    }

    public function get_branches() {
        $branch_ids = implode(",", array_map(function($b) { return $b['id']; }, $this->branches['list']));

        //if the user has no branches, return an empty string
        if (empty($branch_ids)) {
            return "0";
        }

        return $branch_ids;
    }

    public function get_departments() {
        $department_ids = implode(",", array_map(function($d) { return $d['id']; }, $this->departments['list']));

        //if the user has no departments, return an empty string
        if (empty($department_ids)) {
            return "0";
        }

        return $department_ids;
    }

    public function validate_access($params) {
        // Add implementation logic here
    }

    public function dump() {
        return [
            "id" => $this->id,
            "branches" => $this->branches,
            "departments" => $this->departments,
            "person_first_name" => $this->person_first_name,
            "person_last_name" => $this->person_last_name,
            "person_email" => $this->person_email,
            "person_phone" => $this->person_phone,
            "role_id" => $this->role_id,
            "role_name" => $this->role_name,
            "company_id" => $this->company_id,
            "company_name" => $this->company_name,
            "organization_id" => $this->organization_id,
            "organization_name" => $this->organization_name,
            //"preferences" => $this->preferences
        ];
    }
}
