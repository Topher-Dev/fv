<?php
// Function to check service status
function checkServiceStatus($service)
{
    exec("systemctl is-active --quiet $service", $output, $return_var);
    if ($return_var === 0) {
        return "<span style='color: green;'>Active</span>";
    } else {
        return "<span style='color: red;'>Inactive</span>";
    }
}

// List of services to check
$services = array(
    'apache2' => 'Apache',
    'postgresql' => 'PostgreSQL',
    'php' => 'PHP',
    'memcached' => 'Memcache',
    'ratchet' => 'Ratchet WebSocket Server',
);

// HTML output
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Application Status</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        table {
            border-collapse: collapse;
            width: 50%;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
        }
        span {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h2>Application Status</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>Status</th>
        </tr>
        <?php foreach ($services as $service => $displayName): ?>
        <tr>
            <td><span><?php echo $displayName; ?></span></td>
            <td><?php echo checkServiceStatus($service); ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
