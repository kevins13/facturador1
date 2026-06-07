const db = require('./src/db');
const { clients, invoices, invoiceItems } = require('./src/db/schema');

// Clientes de prueba variados
const clientesData = [
  { name: 'Empresa Alpha S.A.',       email: 'alpha@empresa.com',   phone: '011-4500-1111', address: 'Av. Corrientes 1234, CABA',    cuit: '30-12345678-9' },
  { name: 'Beta Comercial S.R.L.',    email: 'info@betacom.com',    phone: '011-4600-2222', address: 'Av. Santa Fe 5678, CABA',      cuit: '30-23456789-0' },
  { name: 'Gamma Tecnología S.A.',    email: 'contacto@gammatech.com', phone: '011-4700-3333', address: 'Maipú 900, CABA',           cuit: '30-34567890-1' },
  { name: 'Delta Servicios S.A.',     email: 'admin@deltaserv.com', phone: '011-4800-4444', address: 'Florida 100, CABA',            cuit: '30-45678901-2' },
  { name: 'Épsilon Consulting S.R.L.', email: 'hola@epsilon.com',   phone: '0351-450-5555', address: 'Colón 300, Córdoba',           cuit: '30-56789012-3' },
];

// Items predefinidos para distintos precios
const itemsPor35k = [
  { description: 'Servicio de consultoría tecnológica - Pack Standard', quantity: 1, price: 35000 },
];
const itemsPor30k = [
  { description: 'Desarrollo web - Módulo básico', quantity: 1, price: 15000 },
  { description: 'Mantenimiento mensual', quantity: 1, price: 15000 },
];
const itemsPor40k = [
  { description: 'Implementación de sistema ERP - Licencia anual', quantity: 1, price: 40000 },
];

// Genera una fecha aleatoria dentro de los últimos 6 meses
function randomDate() {
  const now = new Date();
  const pastMs = Math.floor(Math.random() * 6 * 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - pastMs);
}

// Distribución de facturas: 7 de 35k, 7 de 30k, 6 de 40k = 20 total
const facturasDef = [
  ...Array(7).fill({ total: 35000, items: itemsPor35k, status: 'paid' }),
  ...Array(7).fill({ total: 30000, items: itemsPor30k, status: 'pending' }),
  ...Array(6).fill({ total: 40000, items: itemsPor40k, status: 'pending' }),
];

async function main() {
  console.log('🌱 Iniciando seed de facturas de prueba...\n');

  // 1. Insertar clientes
  console.log('📋 Insertando clientes...');
  const clientesInsertados = await db
    .insert(clients)
    .values(clientesData)
    .returning();
  console.log(`   ✅ ${clientesInsertados.length} clientes creados.\n`);

  // 2. Insertar 20 facturas
  console.log('🧾 Insertando 20 facturas...');
  let totalCreadas = 0;

  for (let i = 0; i < facturasDef.length; i++) {
    const def = facturasDef[i];
    // Asignar cliente en round-robin
    const cliente = clientesInsertados[i % clientesInsertados.length];
    const fecha = randomDate();

    // Insertar factura
    const [factura] = await db
      .insert(invoices)
      .values({
        clientId: cliente.id,
        date: fecha,
        status: def.status,
        total: def.total,
      })
      .returning();

    // Insertar ítems de la factura
    const itemsConId = def.items.map((item) => ({
      ...item,
      invoiceId: factura.id,
      subtotal: item.quantity * item.price,
    }));
    await db.insert(invoiceItems).values(itemsConId);

    totalCreadas++;
    console.log(
      `   ✅ Factura #${factura.id} | Cliente: ${cliente.name} | Total: $${def.total.toLocaleString('es-AR')} | Estado: ${def.status}`
    );
  }

  console.log(`\n🎉 Seed completado: ${totalCreadas} facturas creadas exitosamente.`);
  console.log('   • 7 facturas de $35.000');
  console.log('   • 7 facturas de $30.000');
  console.log('   • 6 facturas de $40.000');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
