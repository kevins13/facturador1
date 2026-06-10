const { pgTable, serial, varchar, timestamp, integer, doublePrecision } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('SELLER').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }),
  price: doublePrecision('price').notNull(),
  stock: integer('stock').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 100 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  cuit: varchar('cuit', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  date: timestamp('date').defaultNow(),
  type: varchar('type', { length: 50 }).default('invoice').notNull(), // 'invoice' or 'quote'
  status: varchar('status', { length: 50 }).default('pending'),
  discount: doublePrecision('discount').default(0),
  subtotal: doublePrecision('subtotal').default(0),
  taxTotal: doublePrecision('tax_total').default(0),
  total: doublePrecision('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  taxRate: doublePrecision('tax_rate').default(0),
  taxAmount: doublePrecision('tax_amount').default(0),
  subtotal: doublePrecision('subtotal').notNull(),
});

// Relaciones para query builder
const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
}));

const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
}));

module.exports = {
  users,
  products,
  clients,
  invoices,
  invoiceItems,
  invoicesRelations,
  invoiceItemsRelations,
  clientsRelations,
};
