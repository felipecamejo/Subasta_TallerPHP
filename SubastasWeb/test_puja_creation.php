<?php

require_once 'vendor/autoload.php';

use App\Models\Puja;
use App\Mappers\Mapper;

// Simulate creating a puja
try {
    echo "Testing Puja creation and mapping...\n";
    
    // Create test data similar to what the API receives
    $testData = [
        'fechaHora' => '2025-06-03T22:51:29.713Z',
        'monto' => 230,
        'cliente_id' => null,
        'lote_id' => 1
    ];
    
    echo "Test data created successfully\n";
    
    // Test the Mapper with a mock Puja object
    $mockPuja = new Puja();
    $mockPuja->id = 999; // Mock ID
    $mockPuja->fechaHora = $testData['fechaHora'];
    $mockPuja->monto = $testData['monto'];
    $mockPuja->cliente_id = $testData['cliente_id'];
    $mockPuja->lote_id = $testData['lote_id'];
    
    echo "Mock Puja created\n";
    
    // Test the mapper with limited depth
    $visited = [];
    $dto = Mapper::fromModelPuja($mockPuja, $visited, 1);
    
    echo "Mapper test successful!\n";
    echo "DTO created with ID: " . $dto->id . "\n";
    echo "DTO monto: " . $dto->monto . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
