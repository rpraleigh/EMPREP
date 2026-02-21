-- Seed: English alert templates
INSERT INTO alert_templates (name, severity, locale, subject, body, channel) VALUES
  ('Evacuation Order',    'critical', 'en', 'EVACUATION ORDER – {{zone}}',       'An evacuation order has been issued for {{zone}}. Leave immediately via {{route}}.', 'both'),
  ('Shelter in Place',   'critical', 'en', 'SHELTER IN PLACE – {{zone}}',        'Shelter in place immediately in {{zone}}. Close all windows and doors.', 'both'),
  ('Flash Flood Warning', 'warning', 'en', 'Flash Flood Warning – {{area}}',     'Flash flooding is possible in {{area}} through {{time}}. Avoid low-lying areas.', 'both'),
  ('Road Closure',        'warning', 'en', 'Road Closure – {{road}}',            '{{road}} is closed due to {{reason}}. Use alternate routes.', 'push'),
  ('Shelter Open',         'info',   'en', 'Shelter Now Open – {{shelter}}',     '{{shelter}} is now open and accepting evacuees. Address: {{address}}.', 'both'),
  ('All Clear',            'info',   'en', 'All Clear – {{zone}}',               'The emergency in {{zone}} has ended. It is now safe to return.', 'both');

-- Seed: Spanish equivalents
INSERT INTO alert_templates (name, severity, locale, subject, body, channel) VALUES
  ('Evacuation Order',    'critical', 'es', 'ORDEN DE EVACUACIÓN – {{zone}}',    'Se ha emitido una orden de evacuación para {{zone}}. Salga inmediatamente por {{route}}.', 'both'),
  ('Shelter in Place',   'critical', 'es', 'REFUGIARSE EN EL LUGAR – {{zone}}', 'Refugiese inmediatamente en {{zone}}. Cierre todas las ventanas y puertas.', 'both'),
  ('Flash Flood Warning', 'warning', 'es', 'Alerta de Inundación – {{area}}',   'Son posibles inundaciones repentinas en {{area}} hasta las {{time}}. Evite zonas bajas.', 'both'),
  ('Road Closure',        'warning', 'es', 'Cierre de Vía – {{road}}',          '{{road}} está cerrada por {{reason}}. Use rutas alternativas.', 'push'),
  ('Shelter Open',         'info',   'es', 'Refugio Abierto – {{shelter}}',     '{{shelter}} está abierto y aceptando evacuados. Dirección: {{address}}.', 'both'),
  ('All Clear',            'info',   'es', 'Todo Despejado – {{zone}}',         'La emergencia en {{zone}} ha terminado. Ahora es seguro regresar.', 'both');
