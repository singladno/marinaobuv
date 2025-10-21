--
-- PostgreSQL database dump
--

\restrict kYnCDWDYnHJSxO0WSy4GSdYaJq01KLjgasQ4kXHnvBlt6tgPI3HyPSFRiOaT6X1

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS marinaobuv;
--
-- Name: marinaobuv; Type: DATABASE; Schema: -; Owner: dali
--

CREATE DATABASE marinaobuv WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';


ALTER DATABASE marinaobuv OWNER TO dali;

\unrestrict kYnCDWDYnHJSxO0WSy4GSdYaJq01KLjgasQ4kXHnvBlt6tgPI3HyPSFRiOaT6X1
\connect marinaobuv
\restrict kYnCDWDYnHJSxO0WSy4GSdYaJq01KLjgasQ4kXHnvBlt6tgPI3HyPSFRiOaT6X1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: marina_local
--

CREATE TYPE public."Gender" AS ENUM (
    'FEMALE',
    'MALE',
    'UNISEX'
);


ALTER TYPE public."Gender" OWNER TO marina_local;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: marina_local
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'PROVIDER',
    'GRUZCHIK',
    'CLIENT'
);


ALTER TYPE public."Role" OWNER TO marina_local;

--
-- Name: Season; Type: TYPE; Schema: public; Owner: marina_local
--

CREATE TYPE public."Season" AS ENUM (
    'SPRING',
    'SUMMER',
    'AUTUMN',
    'WINTER'
);


ALTER TYPE public."Season" OWNER TO marina_local;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    "parentId" text,
    name text NOT NULL,
    slug text NOT NULL,
    path text NOT NULL,
    sort integer DEFAULT 500 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO marina_local;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text,
    "gruzchikId" text,
    "fullName" text,
    phone text NOT NULL,
    email text,
    address text,
    "transportId" text,
    "transportName" text,
    subtotal numeric(65,30) DEFAULT 0 NOT NULL,
    total numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    label text,
    payment numeric(65,30) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO marina_local;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    article text,
    "priceBox" numeric(65,30) NOT NULL,
    qty integer NOT NULL,
    "itemCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO marina_local;

--
-- Name: ParsingHistory; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."ParsingHistory" (
    id text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    status text DEFAULT 'running'::text NOT NULL,
    "messagesRead" integer DEFAULT 0 NOT NULL,
    "productsCreated" integer DEFAULT 0 NOT NULL,
    "errorMessage" text,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ParsingHistory" OWNER TO marina_local;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    article text,
    "categoryId" text NOT NULL,
    "pricePair" numeric(65,30) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    material text,
    gender public."Gender",
    season public."Season",
    description text,
    "availabilityCheckedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    sizes jsonb,
    "sourceMessageIds" jsonb
);


ALTER TABLE public."Product" OWNER TO marina_local;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    key text,
    alt text,
    sort integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    color text,
    width integer,
    height integer
);


ALTER TABLE public."ProductImage" OWNER TO marina_local;

--
-- Name: Provider; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."Provider" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    place text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Provider" OWNER TO marina_local;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text,
    rating integer NOT NULL,
    title text,
    comment text,
    name text,
    email text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isPublished" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO marina_local;

--
-- Name: User; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."User" (
    id text NOT NULL,
    phone text NOT NULL,
    name text,
    role public."Role" NOT NULL,
    "providerId" text,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO marina_local;

--
-- Name: WaDraftProduct; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."WaDraftProduct" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "providerId" text NOT NULL,
    name text,
    "pricePair" numeric(65,30),
    currency text DEFAULT 'RUB'::text NOT NULL,
    material text,
    gender public."Gender",
    season public."Season",
    description text,
    sizes jsonb,
    "providerDiscount" numeric(65,30),
    "rawGptResponse" jsonb,
    "gptRequest" text,
    "rawGptResponse2" jsonb,
    "gptRequest2" text,
    source jsonb,
    color text,
    "categoryId" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "aiProcessedAt" timestamp(3) without time zone,
    "aiStatus" text,
    article text,
    "aiConfidence" double precision,
    "aiContext" text
);


ALTER TABLE public."WaDraftProduct" OWNER TO marina_local;

--
-- Name: WaDraftProductImage; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."WaDraftProductImage" (
    id text NOT NULL,
    "draftProductId" text NOT NULL,
    url text NOT NULL,
    key text,
    "mimeType" text,
    sha256 text,
    alt text,
    sort integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isFalseImage" boolean DEFAULT false NOT NULL,
    color text,
    width integer,
    height integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."WaDraftProductImage" OWNER TO marina_local;

--
-- Name: WhatsAppMessage; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public."WhatsAppMessage" (
    id text NOT NULL,
    "waMessageId" text NOT NULL,
    "from" text,
    type text,
    source text,
    "chatId" text,
    "fromMe" boolean DEFAULT false NOT NULL,
    "fromName" text,
    "timestamp" bigint,
    "mediaId" text,
    "mediaWidth" integer,
    "mediaHeight" integer,
    "mediaSha256" text,
    "mediaPreview" text,
    "mediaFileSize" integer,
    "mediaMimeType" text,
    text text,
    "mediaS3Key" text,
    "mediaUrl" text,
    "providerId" text,
    processed boolean DEFAULT false NOT NULL,
    "rawPayload" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "draftProductId" text,
    "aiGroupId" text
);


ALTER TABLE public."WhatsAppMessage" OWNER TO marina_local;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: marina_local
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO marina_local;

--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."Category" (id, "parentId", name, slug, path, sort, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."Order" (id, "orderNumber", "userId", "gruzchikId", "fullName", phone, email, address, "transportId", "transportName", subtotal, total, status, label, payment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."OrderItem" (id, "orderId", "productId", slug, name, article, "priceBox", qty, "itemCode", "createdAt") FROM stdin;
\.


--
-- Data for Name: ParsingHistory; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."ParsingHistory" (id, "startedAt", "completedAt", status, "messagesRead", "productsCreated", "errorMessage", duration, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."Product" (id, slug, name, article, "categoryId", "pricePair", currency, material, gender, season, description, "availabilityCheckedAt", "createdAt", "updatedAt", "isActive", sizes, "sourceMessageIds") FROM stdin;
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."ProductImage" (id, "productId", url, key, alt, sort, "isPrimary", color, width, height) FROM stdin;
\.


--
-- Data for Name: Provider; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."Provider" (id, name, phone, place, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."Review" (id, "productId", "userId", rating, title, comment, name, email, "isVerified", "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."User" (id, phone, name, role, "providerId", "passwordHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WaDraftProduct; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."WaDraftProduct" (id, "messageId", "providerId", name, "pricePair", currency, material, gender, season, description, sizes, "providerDiscount", "rawGptResponse", "gptRequest", "rawGptResponse2", "gptRequest2", source, color, "categoryId", status, "isDeleted", "createdAt", "updatedAt", "aiProcessedAt", "aiStatus", article, "aiConfidence", "aiContext") FROM stdin;
\.


--
-- Data for Name: WaDraftProductImage; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."WaDraftProductImage" (id, "draftProductId", url, key, "mimeType", sha256, alt, sort, "isPrimary", "isFalseImage", color, width, height, "createdAt", "isActive") FROM stdin;
\.


--
-- Data for Name: WhatsAppMessage; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public."WhatsAppMessage" (id, "waMessageId", "from", type, source, "chatId", "fromMe", "fromName", "timestamp", "mediaId", "mediaWidth", "mediaHeight", "mediaSha256", "mediaPreview", "mediaFileSize", "mediaMimeType", text, "mediaS3Key", "mediaUrl", "providerId", processed, "rawPayload", "createdAt", "updatedAt", "draftProductId", "aiGroupId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: marina_local
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
896215b2-c726-4cd8-9c07-6824f3b3fab2	c21142841fd497a1ba4acf0b8cadbf707cd268d60c8d336e01c6f3d98ff1cfc1	2025-10-06 08:38:11.586226+03	20250916211900_init	\N	\N	2025-10-06 08:38:11.553062+03	1
c0e1dfbe-45f3-457b-84fb-51d730e72e31	fb61e32c91269c0dd1caf81791e923ef13c3fb8e74bcfa7bc05b7a5b00bc3956	2025-10-06 08:38:11.587708+03	20250917204953_add_isactive_to_draft_images	\N	\N	2025-10-06 08:38:11.586655+03	1
91f4c46b-ea70-4125-a203-30dc3c8474e0	a7c34779aaa1b2c561debf42633ec1ab46fcc0f1ba471d1304211d9017212a4f	2025-10-06 08:38:11.588902+03	20250919160723_add_ai_status_fields	\N	\N	2025-10-06 08:38:11.588047+03	1
b2bca688-bf9a-4751-9129-af4ac4323468	0518069550cea5a840545ac94f78c51f6fdee2d30cc5904e6dfa133dda912656	2025-10-06 08:38:11.590291+03	20250919190004_make_draft_product_name_nullable	\N	\N	2025-10-06 08:38:11.589251+03	1
c1b13f19-26d0-4fd9-b093-366e919b0f1a	2249e132382bcf13c29d2b00caa1f0850cd5391eb28433d71c510309e795d5b8	2025-10-06 08:38:11.593303+03	20250920083918_add_isactive_to_products	\N	\N	2025-10-06 08:38:11.590664+03	1
17b7126b-beba-42e2-bda4-5622022f6fcc	4694572848708a72ea5fb90396717659047606d9b719cd2f2ad94ad03935315d	2025-10-06 08:38:11.594737+03	20250920151333_add_article_to_draft_products	\N	\N	2025-10-06 08:38:11.59378+03	1
d7c0b8f8-e61c-4f58-b5f4-194ca65debf0	dae85d590f1c04048272850ff0efa85619965d6f459803a2b375dbf88227da31	2025-10-06 08:38:11.618536+03	20251002173620_add_parsing_history	\N	\N	2025-10-06 08:38:11.59514+03	1
39b5f37e-4aae-489d-bf59-a4c505c304b1	b6bd3c16545b1ba7a159ecaca14c6e7a7e188175f57b0c2881b7e4e94de93d16	2025-10-06 08:38:11.622357+03	20251003204406_remove_product_sizes_table_add_sizes_json	\N	\N	2025-10-06 08:38:11.618963+03	1
40afcf43-9667-4fd6-862c-5fc4048da8f1	e64c19a81e4e6f7292cce38db6abe38541bc2da6e4147ae8205b2b81fa976109	2025-10-06 08:38:11.623399+03	20251003232713_add_source_message_ids_to_products	\N	\N	2025-10-06 08:38:11.622735+03	1
\.


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: ParsingHistory ParsingHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."ParsingHistory"
    ADD CONSTRAINT "ParsingHistory_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Provider Provider_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Provider"
    ADD CONSTRAINT "Provider_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WaDraftProductImage WaDraftProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProductImage"
    ADD CONSTRAINT "WaDraftProductImage_pkey" PRIMARY KEY (id);


--
-- Name: WaDraftProduct WaDraftProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProduct"
    ADD CONSTRAINT "WaDraftProduct_pkey" PRIMARY KEY (id);


--
-- Name: WhatsAppMessage WhatsAppMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WhatsAppMessage"
    ADD CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Category_parentId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Category_parentId_idx" ON public."Category" USING btree ("parentId");


--
-- Name: Category_path_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "Category_path_key" ON public."Category" USING btree (path);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: OrderItem_itemCode_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "OrderItem_itemCode_idx" ON public."OrderItem" USING btree ("itemCode");


--
-- Name: OrderItem_itemCode_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "OrderItem_itemCode_key" ON public."OrderItem" USING btree ("itemCode");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_gruzchikId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Order_gruzchikId_idx" ON public."Order" USING btree ("gruzchikId");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: ParsingHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "ParsingHistory_createdAt_idx" ON public."ParsingHistory" USING btree ("createdAt");


--
-- Name: ParsingHistory_startedAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "ParsingHistory_startedAt_idx" ON public."ParsingHistory" USING btree ("startedAt");


--
-- Name: ParsingHistory_status_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "ParsingHistory_status_idx" ON public."ParsingHistory" USING btree (status);


--
-- Name: ProductImage_key_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "ProductImage_key_key" ON public."ProductImage" USING btree (key);


--
-- Name: ProductImage_productId_sort_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "ProductImage_productId_sort_idx" ON public."ProductImage" USING btree ("productId", sort);


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Product_isActive_idx" ON public."Product" USING btree ("isActive");


--
-- Name: Product_pricePair_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Product_pricePair_idx" ON public."Product" USING btree ("pricePair");


--
-- Name: Product_season_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Product_season_idx" ON public."Product" USING btree (season);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Provider_name_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Provider_name_idx" ON public."Provider" USING btree (name);


--
-- Name: Provider_name_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "Provider_name_key" ON public."Provider" USING btree (name);


--
-- Name: Provider_phone_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Provider_phone_idx" ON public."Provider" USING btree (phone);


--
-- Name: Provider_place_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Provider_place_idx" ON public."Provider" USING btree (place);


--
-- Name: Review_createdAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Review_createdAt_idx" ON public."Review" USING btree ("createdAt");


--
-- Name: Review_isPublished_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Review_isPublished_idx" ON public."Review" USING btree ("isPublished");


--
-- Name: Review_productId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Review_productId_idx" ON public."Review" USING btree ("productId");


--
-- Name: Review_rating_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "Review_rating_idx" ON public."Review" USING btree (rating);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: User_providerId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "User_providerId_idx" ON public."User" USING btree ("providerId");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: WaDraftProductImage_draftProductId_sort_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProductImage_draftProductId_sort_idx" ON public."WaDraftProductImage" USING btree ("draftProductId", sort);


--
-- Name: WaDraftProductImage_key_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "WaDraftProductImage_key_key" ON public."WaDraftProductImage" USING btree (key);


--
-- Name: WaDraftProduct_categoryId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProduct_categoryId_idx" ON public."WaDraftProduct" USING btree ("categoryId");


--
-- Name: WaDraftProduct_createdAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProduct_createdAt_idx" ON public."WaDraftProduct" USING btree ("createdAt");


--
-- Name: WaDraftProduct_isDeleted_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProduct_isDeleted_idx" ON public."WaDraftProduct" USING btree ("isDeleted");


--
-- Name: WaDraftProduct_messageId_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "WaDraftProduct_messageId_key" ON public."WaDraftProduct" USING btree ("messageId");


--
-- Name: WaDraftProduct_providerId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProduct_providerId_idx" ON public."WaDraftProduct" USING btree ("providerId");


--
-- Name: WaDraftProduct_status_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WaDraftProduct_status_idx" ON public."WaDraftProduct" USING btree (status);


--
-- Name: WhatsAppMessage_chatId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_chatId_idx" ON public."WhatsAppMessage" USING btree ("chatId");


--
-- Name: WhatsAppMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_createdAt_idx" ON public."WhatsAppMessage" USING btree ("createdAt");


--
-- Name: WhatsAppMessage_fromMe_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_fromMe_idx" ON public."WhatsAppMessage" USING btree ("fromMe");


--
-- Name: WhatsAppMessage_from_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_from_idx" ON public."WhatsAppMessage" USING btree ("from");


--
-- Name: WhatsAppMessage_providerId_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_providerId_idx" ON public."WhatsAppMessage" USING btree ("providerId");


--
-- Name: WhatsAppMessage_timestamp_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_timestamp_idx" ON public."WhatsAppMessage" USING btree ("timestamp");


--
-- Name: WhatsAppMessage_type_idx; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE INDEX "WhatsAppMessage_type_idx" ON public."WhatsAppMessage" USING btree (type);


--
-- Name: WhatsAppMessage_waMessageId_key; Type: INDEX; Schema: public; Owner: marina_local
--

CREATE UNIQUE INDEX "WhatsAppMessage_waMessageId_key" ON public."WhatsAppMessage" USING btree ("waMessageId");


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_gruzchikId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_gruzchikId_fkey" FOREIGN KEY ("gruzchikId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WaDraftProductImage WaDraftProductImage_draftProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProductImage"
    ADD CONSTRAINT "WaDraftProductImage_draftProductId_fkey" FOREIGN KEY ("draftProductId") REFERENCES public."WaDraftProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WaDraftProduct WaDraftProduct_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProduct"
    ADD CONSTRAINT "WaDraftProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WaDraftProduct WaDraftProduct_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProduct"
    ADD CONSTRAINT "WaDraftProduct_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."WhatsAppMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WaDraftProduct WaDraftProduct_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WaDraftProduct"
    ADD CONSTRAINT "WaDraftProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WhatsAppMessage WhatsAppMessage_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marina_local
--

ALTER TABLE ONLY public."WhatsAppMessage"
    ADD CONSTRAINT "WhatsAppMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DATABASE marinaobuv; Type: ACL; Schema: -; Owner: dali
--

GRANT ALL ON DATABASE marinaobuv TO marinaobuv_user;
GRANT ALL ON DATABASE marinaobuv TO marina_local;


--
-- PostgreSQL database dump complete
--

\unrestrict kYnCDWDYnHJSxO0WSy4GSdYaJq01KLjgasQ4kXHnvBlt6tgPI3HyPSFRiOaT6X1

