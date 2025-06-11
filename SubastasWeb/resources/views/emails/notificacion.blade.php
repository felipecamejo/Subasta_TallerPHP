<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $asunto }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            margin-top: 20px;
        }
        h1 {
            color: #007bff;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $asunto }}</h1>
    </div>
    
    <div class="content">
        <p>{{ $mensaje }}</p>
    </div>
    
    <div class="footer">
        <p>Este es un email automático del sistema de subastas.</p>
        <p>Por favor, no responda a este correo.</p>
    </div>
</body>
</html>
