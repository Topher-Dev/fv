<?php
//declare(strict_types=1);
/*
*  
*  The Token class is used to manage the users Token which contains, keep the user logged in and manage the users JWT token 
*   The Token class is used to manage the users Token which contains, keep the user logged in and manage the users JWT token
*   it is stored in the browser and sent with every request to the server, 
*   encrypted with a secret key, this key is stored in the server environment variables.
*   The token is composed of 3 parts:
*       - Header: contains the algorithm used to encrypt the token and the type of token
*       - Payload (JWT Claims Set): 
*           iat: The time at which the token was issued (unix timestamp)
*           iss: The issuer of the token (domain name)
*           sub: The subject of the token (user_id)
*           rol: The role the client occupies (clerk, admin, su)
*           exp: The expiration time of the token (unix timestamp)
*       - Signature: contains the encrypted token
*   It's important to note that the token's payload can be decoded with little effort and should be stored with non sensitive information and
*   
* 
*   More info in docs/
*/

//Class Token
class Token
{
    public $payload = null;
    public $df = "Y-m-d H:i:s";
    public $debug = true;

    //Constructor
    public function __construct($token = null){
        $this->token = $token;

    }

    /**
     * Create a new JWT token
     * @param $user_id username of the user
     * @return $token JWT token
     */
    public function issue(int $user_id, string $role_id, string $company_id){

        //build the headers & encode
        $headers = [
            'alg'=>'HS256',
            'typ'=>'JWT'
        ];
        $headers_encoded = $this->base64_encode_url(json_encode($headers));

        if (!isset($_SERVER['JWT_EXPIRES_IN'])){
            return $this->error("JWT_EXPIRES_IN is not set, check your configuration file");
        }
        
        $now = new DateTimeImmutable(date($this->df));

        //Add the expiration time to the current time
        $expires = $now->modify($_SERVER['JWT_EXPIRES_IN']);

        if (!isset($_SERVER['DOMAIN'])){
            return $this->error("DOMAIN is not set, check your configuration file");
        }

        //build the payload
        $payload = [
            'iat' => $now,                      //The time at which the token was issued (unix timestamp)
            'iss' => $_SERVER['DOMAIN'],   //The issuer of the token (domain name),
            'sub' => $user_id,                  //The subject of the token (user_id),
            'rol' => $role_id,                  //The role alocated to the client (clerk, admin, su),
            'cmp' => $company_id,               //The company the client is allocated to,
            'exp' => $expires                   //The expiration time of the token (unix timestamp)
        ];

        //encode the payload
        $payload_encoded = $this->base64_encode_url(json_encode($payload));
        
        if (!isset($_SERVER['JWT_SECRET']) || strlen($_SERVER['JWT_SECRET']) < 32){
            return $this->error("JWT_SECRET is not set or is too short (minimum 256 bits) amend your configuration file");
        }

        //build & encode the signature
        $signature = hash_hmac('sha256',"$headers_encoded.$payload_encoded",$_SERVER['JWT_SECRET'],true);
        $signature_encoded = $this->base64_encode_url($signature);
        
        //token complete
        return "$headers_encoded.$payload_encoded.$signature_encoded";
    }

    /**
     * Parse a JWT token into its three parts
     * @param $encoded_jwt JWT token included in the request
     * @return $token object containing the token's header, payload and signature 
     */
    public function parse(array $token_parts){

        $token = new stdClass();

        $token->header = json_decode(base64_decode(str_replace('_', '/', str_replace('-','+',$token_parts[0]))));
        $token->payload = json_decode(base64_decode(str_replace('_', '/', str_replace('-','+',$token_parts[1]))));
        $token->signature = $token_parts[2];

        //check if the dedeoce was successful
        if (!$token->header || !$token->payload){
            return false;
        }

        return $token;

    }

    /*
    *   Base64 encode a string with url safe characters
    *   @param $string string to encode
    *   @return $encoded_string encoded string
    */
    public function validate(){
        $client_token = $this->token;
        //check if token is null 
        if ($client_token == "null"){
            return $this->error("Token is null");
        }

        $token_parts = explode('.', $client_token);

        if (count($token_parts) != 3) {
            return $this->error("Token is structured incorrectly");
        }

        //Encrypt with secret value and compare for validity
        $signature = hash_hmac('sha256',"{$token_parts[0]}.{$token_parts[1]}",$_SERVER['JWT_SECRET'],true);
        $signature_encoded = $this->base64_encode_url($signature);

        if ($token_parts[2] != $signature_encoded){
            return $this->error("Token has been tampered with!");
        }

        //parse the token into an object to access the payload
        $token = $this->parse($token_parts);

        if (!$token){
            return $this->error("Token failed parsing");
        }

        //setup to compare DateTime Objects
        $now = new DateTimeImmutable();
        $token_exp_date = new DateTimeImmutable($token->payload->exp->date);

        //check if the token is expired
        if ($now->format($this->df) > $token_exp_date->format($this->df)){
            return $this->error("Token has expired");
        } else {
            //calculate remaining time
            $remaining = $token_exp_date->diff($now)->format('%d days, %h hours, %i minutes, %s seconds');
            error_log("Token not expired: {$remaining}");
        }

        $this->payload = $token->payload;

        return true;
    }


    private function error($msg){

        $this->debug && error_log("DEBUG: $msg");
        return false;
    }

    public function base64_encode_url($string) {
        return str_replace(['+','/','='], ['-','_',''], base64_encode($string));
    }
    
    public function base64_decode_url($string) {
        return base64_decode(str_replace(['-','_'], ['+','/'], $string));
    }
}

//UNIT TEST
// Path: web/server/arc.php

// if ($argv && $argv[0] && realpath($argv[0]) === __FILE__) {

//     function tlog($msg){
//         error_log("TEST: $msg");
//     }

//     tlog("Running unit test");

//     $session = new Session();
//     $session->debug = true;

//     //create a test token
//     $token = $session->issue(1, "admin");
//     tlog("token = $token");

//     //parse the test token
//     $parsed_token = $session->validate($token);
//     tlog("parsed_token = " . json_encode($parsed_token, JSON_PRETTY_PRINT));

// }

