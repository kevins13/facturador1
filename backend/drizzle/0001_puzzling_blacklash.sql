CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"price" double precision NOT NULL,
	"stock" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'SELLER' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "type" varchar(50) DEFAULT 'invoice' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "subtotal" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_total" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "tax_rate" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "tax_amount" double precision DEFAULT 0;