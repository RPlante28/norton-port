<?php
// Simple, honest visitor counter. Increments once per browser session and
// returns the running total as JSON. Stored in counter.dat next to this file
// (the directory must be writable by the web server).
header('Content-Type: application/json');
header('Cache-Control: no-store');
session_start();

$file = __DIR__ . '/counter.dat';
$fp = @fopen($file, 'c+');
if ($fp === false) {
    echo json_encode(['count' => null]);
    exit;
}

flock($fp, LOCK_EX);
$count = (int) stream_get_contents($fp);
if (empty($_SESSION['nc_counted'])) {
    $count++;
    $_SESSION['nc_counted'] = true;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, (string) $count);
    fflush($fp);
}
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['count' => $count]);
