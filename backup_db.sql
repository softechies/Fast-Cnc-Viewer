--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: model_views; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.model_views (
    id integer NOT NULL,
    model_id integer NOT NULL,
    share_id text,
    ip_address text NOT NULL,
    user_agent text,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL,
    authenticated boolean
);


ALTER TABLE public.model_views OWNER TO neondb_owner;

--
-- Name: model_views_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.model_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.model_views_id_seq OWNER TO neondb_owner;

--
-- Name: model_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.model_views_id_seq OWNED BY public.model_views.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.models (
    id integer NOT NULL,
    user_id integer,
    filename text NOT NULL,
    filesize integer NOT NULL,
    format text,
    created text NOT NULL,
    source_system text,
    metadata jsonb,
    share_id text,
    share_enabled boolean DEFAULT false,
    share_password text,
    share_expiry_date text,
    share_email text,
    share_notification_sent boolean DEFAULT false,
    share_last_accessed text
);


ALTER TABLE public.models OWNER TO neondb_owner;

--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.models_id_seq OWNER TO neondb_owner;

--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: model_views id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.model_views ALTER COLUMN id SET DEFAULT nextval('public.model_views_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: model_views; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.model_views (id, model_id, share_id, ip_address, user_agent, viewed_at, authenticated) FROM stdin;
1	209	399rafFVoU	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:14:02.015	\N
2	209	399rafFVoU	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:14:05.814	t
3	209	399rafFVoU	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:15:14.586	\N
4	209	399rafFVoU	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:15:19.295	t
5	209	399rafFVoU	93.175.137.132	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:16:50.143	\N
6	208	V4ERIGDtVK	94.40.62.132	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36	2025-04-16 11:22:39.291	\N
7	209	399rafFVoU	185.39.160.4	Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36	2025-04-16 11:22:56.854	\N
8	208	V4ERIGDtVK	91.150.166.165	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36	2025-04-16 11:23:35.536	\N
9	208	V4ERIGDtVK	178.219.129.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36	2025-04-16 11:23:37.261	\N
10	205	celiiMF_d-	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:35:06.203	\N
11	205	celiiMF_d-	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:35:10.986	t
12	208	V4ERIGDtVK	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:35:41.381	\N
13	208	V4ERIGDtVK	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:35:59.715	t
14	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:36:44.042	\N
15	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:36:48.689	t
16	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-16 11:37:07.444	\N
17	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-16 11:37:12.295	t
18	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:54:06.84	\N
19	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 11:54:12.675	t
20	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:54:26.154	\N
21	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:54:37.56	\N
22	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:54:42.656	t
23	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:55:00.372	\N
24	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:55:05.06	t
25	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:55:27.608	\N
26	205	celiiMF_d-	85.11.75.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36	2025-04-16 11:55:30.794	t
27	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 12:14:03.711	t
28	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0	2025-04-16 12:17:34.561	t
29	205	celiiMF_d-	46.134.132.22, 34.111.179.208, 35.191.84.252,34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 12:17:48.592	\N
30	205	celiiMF_d-	46.134.132.22, 34.111.179.208, 35.191.84.240,35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 12:17:52.351	t
31	210	li7yWOkf4p	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 12:34:36.295	t
32	211	xGH77kzSz9	46.134.132.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0	2025-04-16 12:35:33.698	t
33	205	celiiMF_d-	46.134.132.22	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-16 12:40:50.96	t
\.


--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.models (id, user_id, filename, filesize, format, created, source_system, metadata, share_id, share_enabled, share_password, share_expiry_date, share_email, share_notification_sent, share_last_accessed) FROM stdin;
6	1	Frame.step	870609	STEP	2025-04-03T06:17:26.447Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/4e6b12ea6bf3f56205100ad48cac0dbc", "surfaces": 40, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-6STEHC", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
7	1	Excenter 3.8pen v17.step	386401	STEP AP242	2025-04-03T06:17:52.533Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/bdcc25f7af5db33f8b985682508d6c86", "surfaces": 66, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-AE9LDU", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
8	1	pÅyta wersja 2.step	43316	STEP AP242	2025-04-03T07:43:35.387Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/a34685cc4c8ecf998343c79d110ca6c0", "surfaces": 10, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-TUTNX9", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
9	1	Excenter 3.8pen v17.step	386401	STEP AP242	2025-04-03T07:43:49.594Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/371127e75c12dd9cc5902d9de7569252", "surfaces": 66, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP--O1GBX", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
10	1	pÅyta wersja 2.step	43316	STEP AP242	2025-04-03T07:47:11.263Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/3eb659bb3d3195fee74d5e368b32e250", "surfaces": 10, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-ONGBBI", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
11	1	versace.step	5501464	STEP	2025-04-03T07:47:38.813Z	Unknown	{"parts": 14, "format": "STEP", "solids": 14, "filePath": "/tmp/step-uploads/9ef405f1cbe46deff2b9558197c0c629", "surfaces": 4750, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-KWFR-P", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
12	1	Excenter 3.8pen v17.step	386401	STEP AP242	2025-04-03T07:51:50.057Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/148ef9258469038b700e03e971e81ae5", "surfaces": 66, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-YZL1IR", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
13	1	Frame.step	870609	STEP	2025-04-03T07:57:27.161Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/342d82f2e9849ba575b74c31571c26be", "surfaces": 40, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-IQYUIU", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
14	1	Frame.step	870609	STEP	2025-04-03T08:03:17.766Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/8984466c9abc7076bcf59ff2d664be8a", "surfaces": 40, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-MQTKDW", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
15	1	ECC-3.8a.step	56853	STEP	2025-04-03T08:07:22.280Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/7a56379c28f2fbadcf266549d8f8d15a", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-GQLR1W", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
16	1	Battery Tray.stp	160159	STEP	2025-04-03T08:08:26.117Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/72476b8612bdab6c448399bf1cc67f16", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-LKGRLM", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
17	1	zaslepka.stp	19212	STEP	2025-04-03T08:58:29.146Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/a6449b58a6372002fb98daa547e853ea", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-90TYZ0", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
18	1	zaslepka.stp	19212	STEP	2025-04-03T09:02:07.577Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/5053bc18b72bea9884bece515153cc36", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-146F_D", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
19	1	podstawka-cc.stp	65598	STEP	2025-04-03T09:03:55.630Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/4ac6666b0e70aae2a4c267a8ae561290", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-LL3YZS", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
20	1	uchwyt.stp	25401	STEP	2025-04-03T09:12:36.734Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/4467694df6f40cceb2a6eea9a5c74207", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-KJAUDR", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
21	1	podstawka-cc.stp	65598	STEP	2025-04-03T09:13:18.950Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/0a7d040b6489d33ec8c368645f79b0b0", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-MJE-FW", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
22	1	podstawka-cc.stp	65598	STEP	2025-04-03T09:13:25.240Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/cbcffe4c47b0c08def9c0ab514d31b17", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-PWR03G", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
23	1	zaslepka.stp	19212	STEP	2025-04-03T09:13:35.283Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/0f4597f7669b4827f9ca78dbb4ad1d01", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-QAKING", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
24	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-03T09:13:58.940Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/75fc0de4f92826b8c15d126e11e485a9", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-IJO3OX", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
25	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-03T09:18:50.003Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/578264144b064f237b928cf336d4d095", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-SZXEOY", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
26	1	Janusz_1.step	2110333	STEP AP242	2025-04-03T09:19:21.248Z	Unknown	{"parts": 5, "format": "STEP AP242", "solids": 5, "filePath": "/tmp/step-uploads/77ca9f14692154ab75738ca952407a9a", "surfaces": 2, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-NFURLP", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
27	1	zaslepka.stp	19212	STEP	2025-04-03T09:19:46.281Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/bc918dd5a9bc04baa1fd11cb2e6f8632", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-BRS1GU", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
28	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-03T09:24:30.064Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/e8d9b459c4f9f89b9c3dd414a2c80fc2", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-CIM6JW", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
29	1	zaslepka.stp	19212	STEP	2025-04-03T09:24:50.022Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/df50f71daf819e6024abdc2f77d75869", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-FZMYSF", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
30	1	Janusz_1.step	2110333	STEP AP242	2025-04-03T09:29:17.291Z	Unknown	{"parts": 5, "format": "STEP AP242", "solids": 5, "filePath": "/tmp/step-uploads/3e28514d479f6ca2dc2f2b788b702c88", "surfaces": 2, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-GA0PY9", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
31	1	sruba.stp	7932	STEP	2025-04-03T09:30:06.632Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/137f4f9639565b72c5576e121474ac7b", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-CFKAVL", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
32	1	sruba.stp	7932	STEP	2025-04-03T09:39:23.300Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/f8c786754ca6e648683c477931efc51c", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-TSR5VQ", "organization": "Unknown"}, "sourceSystem": "Unknown"}	\N	f	\N	\N	\N	f	\N
33	1	Janusz_1.step	2110333	STEP AP242	2025-04-03T09:54:42.859Z	Unknown	{"parts": 5, "format": "STEP AP242", "solids": 5, "filePath": "/tmp/step-uploads/99d8796dea83a934b5bae6df4c3fb176", "surfaces": 2, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-4HSUO7", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
34	1	sruba-stl.stl	15684	STL	2025-04-03T10:08:52.139Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/84b40b650efc4ea3c84850fbdc2e2efa", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-HM5SBN", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/84b40b650efc4ea3c84850fbdc2e2efa"}	\N	f	\N	\N	\N	f	\N
35	1	Janusz_1.step	2110333	STEP AP242	2025-04-03T10:09:27.938Z	Unknown	{"parts": 5, "format": "STEP AP242", "solids": 5, "filePath": "/tmp/step-uploads/6d2912676e28ed099c2bf64e3d3239c2", "surfaces": 2, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-L1K26A", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
36	1	sruba.stp	7932	STEP	2025-04-03T10:10:10.961Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/72a213e8baa58e229fb22ff0200da979", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-5QA0IQ", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
37	1	sruba-stl.stl	15684	STL	2025-04-03T10:10:54.369Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/b10b642dae84c6e6f2f33582fc3cc93d", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ROE5H1", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/b10b642dae84c6e6f2f33582fc3cc93d"}	\N	f	\N	\N	\N	f	\N
38	1	Janusz_1.step	2110333	STEP AP242	2025-04-03T10:20:48.559Z	Unknown	{"parts": 5, "format": "STEP AP242", "solids": 5, "filePath": "/tmp/step-uploads/caf0910b70c53be72ca836bd8020f59a", "surfaces": 2, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-UU3WS0", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
39	1	sruba.stp	7932	STEP	2025-04-03T10:21:01.397Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/204498a2f5f0f18e55ccf8e423132b5a", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-RY27NZ", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
40	1	sruba-stl.stl	15684	STL	2025-04-03T10:21:26.018Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/25ebacc0be2b009823c258f01ecfcdab", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-MZCIKN", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/25ebacc0be2b009823c258f01ecfcdab"}	\N	f	\N	\N	\N	f	\N
41	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-03T10:21:43.065Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/6db3d8e3ccf50415aaa0b1de7161f1a3", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-J9NA9F", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/6db3d8e3ccf50415aaa0b1de7161f1a3"}	\N	f	\N	\N	\N	f	\N
42	1	sruba-stl.stl	15684	STL	2025-04-03T10:30:24.362Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/cc367c04b8e23ac05d19f0b073d2c20e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-L7HOTG", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/cc367c04b8e23ac05d19f0b073d2c20e"}	\N	f	\N	\N	\N	f	\N
43	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-03T10:31:42.070Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/050c516556fe1a62bf2d4737a45d03b5", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-8CHMX6", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/050c516556fe1a62bf2d4737a45d03b5"}	\N	f	\N	\N	\N	f	\N
44	1	sruba.stp	7932	STEP	2025-04-03T10:31:56.613Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/13aa896a1ad946f1b545a69bb83363cd", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP--CV27W", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
45	1	sruba.stp	7932	STEP	2025-04-03T10:32:20.533Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/2816b14e3cbc283cae69753cbfe3c367", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-OJRN7I", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
46	1	sruba-stl.stl	15684	STL	2025-04-03T10:37:04.430Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/3c0edf246869426170a338fc1a0e5534", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-CX0GWJ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/3c0edf246869426170a338fc1a0e5534"}	\N	f	\N	\N	\N	f	\N
47	1	sruba.stp	7932	STEP	2025-04-03T10:37:23.978Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/cbdddff40a6c8f935c9a98c21f0be924", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-THC4ZC", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
48	1	sruba.stp	7932	STEP	2025-04-03T10:37:48.371Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/3de7b809845cc026cec671c3c0b16e52", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-BW1XNC", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
49	1	sruba-stl.stl	15684	STL	2025-04-03T10:47:10.377Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/6869200bd8de5d6b2c159f1c2b236554", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-SJM6MQ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/6869200bd8de5d6b2c159f1c2b236554"}	\N	f	\N	\N	\N	f	\N
50	1	sruba-stl.stl	15684	STL	2025-04-03T10:54:36.005Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/4c21ec6a56dfe8c4de2ec9179ecc9447", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-JDUH-S", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/4c21ec6a56dfe8c4de2ec9179ecc9447"}	\N	f	\N	\N	\N	f	\N
51	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-03T10:55:08.708Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/d3a8820666658fae3abfcdf3bbdf44c8", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-8PXK3X", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
52	1	sruba.stp	7932	STEP	2025-04-03T10:55:29.819Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/5f4a9cfe137a33a20eb8660710de6c45", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-S0HE8N", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
53	1	sruba-stl.stl	15684	STL	2025-04-03T10:59:34.505Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/2f7e791e0103f6febc1c6f954737fcec", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL--RWBCW", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/2f7e791e0103f6febc1c6f954737fcec"}	\N	f	\N	\N	\N	f	\N
54	1	sruba.stp	7932	STEP	2025-04-03T10:59:48.801Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/a7457d0253464719458663f8a7a1a59b", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-G_M9SZ", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
55	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-03T11:09:18.830Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/fb122c36e0906258fa8525c6f389d3a4", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-HGUW5X", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
56	1	sruba.stp	7932	STEP	2025-04-03T11:12:41.175Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/46b19682d15d6520a6086ffd7599d3a1", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-UL7XJM", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
57	1	podstawka-cc.stp	65598	STEP	2025-04-03T11:13:03.281Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/7eed617db307afd26f796bacb19e071d", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-JRQCVM", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
58	1	sruba-stl.stl	15684	STL	2025-04-03T11:15:25.844Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/48746523c5c6117e9026f09b6e3c2206", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-3WH2AB", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/48746523c5c6117e9026f09b6e3c2206"}	\N	f	\N	\N	\N	f	\N
59	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T11:24:32.979Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/68a8ce4d9b0b9e7e38eb8687b8290ac7", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-Q1VINE"}}	\N	f	\N	\N	\N	f	\N
60	1	kratka.dxf	1035127	DXF	2025-04-03T11:25:05.894Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/656ca8d607902dbc1c9874a7b5700664", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-YKGUQZ"}}	\N	f	\N	\N	\N	f	\N
61	1	sruba-stl.stl	15684	STL	2025-04-03T11:25:40.744Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/d4d0bd810d845a04951c7d9a295cd5f8", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-THDFHZ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/d4d0bd810d845a04951c7d9a295cd5f8"}	\N	f	\N	\N	\N	f	\N
62	1	podstawka-cc.dwg	132130	DWG	2025-04-03T11:26:06.170Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/c02ad80d6e2627793316d31d954eaf96", "fileType": "2d", "cadFormat": "dwg", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DWG-0LWAIN"}}	\N	f	\N	\N	\N	f	\N
63	1	gabinet.dwg	124215	DWG	2025-04-03T11:26:54.482Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/fb5663ae6c677c3e9e0105940eb90a12", "fileType": "2d", "cadFormat": "dwg", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DWG-0OW_RH"}}	\N	f	\N	\N	\N	f	\N
64	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T11:29:04.334Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/43382c4b576ccf06bd5a56f7a23be313", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-LV0DBX"}}	\N	f	\N	\N	\N	f	\N
65	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T11:29:56.174Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/8200f7df07d28e7cbf3166a9bc847e24", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-KMAFK_"}}	\N	f	\N	\N	\N	f	\N
66	1	podporka.dxf	267945	DXF	2025-04-03T11:30:32.387Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/317da1fe7276643d8398432e6f0442aa", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-ZHY0I8"}}	\N	f	\N	\N	\N	f	\N
67	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T11:33:20.407Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/415083b428219defa6a9601647d067d8", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-VY-707"}}	\N	f	\N	\N	\N	f	\N
68	1	gabinet.dwg	124215	DWG	2025-04-03T11:34:04.882Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/9b160bba2831282f4e165a71fdc9c8a0", "fileType": "2d", "cadFormat": "dwg", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DWG-0ODYGW"}}	\N	f	\N	\N	\N	f	\N
69	1	gabinet.dxf	334686	DXF	2025-04-03T11:44:47.684Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/5006333403227409c70c843768236a02", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-R-HNMN"}}	\N	f	\N	\N	\N	f	\N
70	1	gabinet.dxf	334686	DXF	2025-04-03T11:49:08.837Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/6085a7f6c84ce142e70f771a2dfcd3ba", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-NCQKP3"}}	\N	f	\N	\N	\N	f	\N
71	1	marka.dxf	269228	DXF	2025-04-03T11:49:43.249Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/41b7b2027ee9a5f0183c8d147f5f6bd6", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-RIJXYV"}}	\N	f	\N	\N	\N	f	\N
72	1	test dxf v1.dxf	351432	DXF	2025-04-03T11:50:04.597Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/6607ce22092839e8d8252f22648de917", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-CCTTQW"}}	\N	f	\N	\N	\N	f	\N
73	1	grill.dxf	294975	DXF	2025-04-03T11:51:38.073Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/f7fe22d958fad8dd03287d4aca233c44", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-GWWSQM"}}	\N	f	\N	\N	\N	f	\N
74	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T11:54:21.818Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/16abd7518bac7db4e45a895393d8b6a0", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-NCB8QM"}}	\N	f	\N	\N	\N	f	\N
75	1	podporka.dxf	267945	DXF	2025-04-03T11:54:40.917Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/37d7be16c45d2d0e42a4ae803174259a", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-FOSNZK"}}	\N	f	\N	\N	\N	f	\N
76	1	gabinet.dxf	334686	DXF	2025-04-03T11:55:17.277Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/100bd05b21584723d5c2fe2ba0bca0dc", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-QHJG2X"}}	\N	f	\N	\N	\N	f	\N
77	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T12:03:07.889Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/4a6f09c7db25d31f8ea140b27b6a9ff8", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-1QURMQ"}}	\N	f	\N	\N	\N	f	\N
78	1	blaszka-3.dxf	144928	DXF	2025-04-03T12:03:38.917Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/f34ef3a0a5018cea2f8100626b9cc4d4", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-FY1-UI"}}	\N	f	\N	\N	\N	f	\N
79	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T12:10:48.941Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/69ed37ce5f535b67f07648e758fc699d", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-BSQRIT"}}	\N	f	\N	\N	\N	f	\N
80	1	grill.dxf	294975	DXF	2025-04-03T12:14:03.223Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/6800d8a1980202c134bb28923a41d58e", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-QPWD4I"}}	\N	f	\N	\N	\N	f	\N
81	1	marka.dxf	269228	DXF	2025-04-03T12:17:26.065Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/78e90e744a7c02835a807414e9a82fa0", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-WOJEQG"}}	\N	f	\N	\N	\N	f	\N
82	1	baza_mocowania (1).dxf	41921	DXF	2025-04-03T12:19:56.564Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/eafd290ba72de4de51d5f1a013c05cd5", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-PBQEWQ"}}	\N	f	\N	\N	\N	f	\N
83	1	grill.dxf	294975	DXF	2025-04-03T12:20:12.490Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/5d12a31f1e6e6ffdf4a459afcb33ff2d", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-JU-FBN"}}	\N	f	\N	\N	\N	f	\N
84	1	grill.dxf	294975	DXF	2025-04-03T12:24:25.566Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/d1d0af9238328606b1ed2e964e37b8a6", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-DRXVAZ"}}	\N	f	\N	\N	\N	f	\N
85	1	podporka.dxf	267945	DXF	2025-04-03T12:24:38.772Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/a22e222d2db85e8f4481a314daa01b91", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-4UP7LJ"}}	\N	f	\N	\N	\N	f	\N
86	1	podporka.dxf	267945	DXF	2025-04-03T12:29:23.946Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/407a4a596b6fe2e1d74abf20c40211a4", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-7T0LJ7"}}	\N	f	\N	\N	\N	f	\N
87	1	gabinet.dxf	334686	DXF	2025-04-03T12:29:38.383Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/b4eb028faca0ed67284a06f3eae8c6f2", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-Y80WEC"}}	\N	f	\N	\N	\N	f	\N
95	1	sruba-stl.stl	15684	STL	2025-04-03T13:38:29.217Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/70d1aa4f6bd1a66a8f2e7e99cec8c39d", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-GMPO0C", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/70d1aa4f6bd1a66a8f2e7e99cec8c39d"}	\N	f	\N	\N	\N	f	\N
90	1	podloga_gumiaczek_test v2.stl	40684	STL	2025-04-03T13:13:54.910Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/7161e6618522774a1161b6ab746f058a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-XPGJWT", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/7161e6618522774a1161b6ab746f058a"}	\N	f	\N	\N	\N	f	\N
91	1	ANGLE_-_Box_-_Standard.stl	4883484	STL	2025-04-03T13:16:52.458Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/5679b488abdb2df1ca5c012dfcd4a623", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-IYELI0", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/5679b488abdb2df1ca5c012dfcd4a623"}	\N	f	\N	\N	\N	f	\N
93	1	ANGLE_-_Box_-_Standard_-_Lid.stl	544584	STL	2025-04-03T13:21:51.826Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/470e73e5513011f647c4dc456a67fcea", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-7-FAS9", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/470e73e5513011f647c4dc456a67fcea"}	\N	f	\N	\N	\N	f	\N
97	1	sruba-stl.stl	15684	STL	2025-04-03T14:28:46.732Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/d2e4de5e1b5b2c93b72cf93d8a96ae9e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-G6EQQ4", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/d2e4de5e1b5b2c93b72cf93d8a96ae9e"}	\N	f	\N	\N	\N	t	\N
98	1	sruba-stl.stl	15684	STL	2025-04-03T14:45:56.790Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/a1b5eeff21cc4d7c84a10d6d6143fdca", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-N32E32", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/a1b5eeff21cc4d7c84a10d6d6143fdca"}	\N	f	\N	\N	\N	t	\N
99	1	sruba-stl.stl	15684	STL	2025-04-03T14:50:36.630Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f087e9965d26c7139d080613c58d1355", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-WNT2DS", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f087e9965d26c7139d080613c58d1355"}	\N	f	\N	\N	\N	t	\N
101	1	sruba-stl.stl	15684	STL	2025-04-03T15:09:33.274Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/0401079776cd2881d2dec168b154b4ad", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-L_GXDO", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/0401079776cd2881d2dec168b154b4ad"}	\N	f	\N	\N	\N	f	\N
89	1	sruba-stl.stl	15684	STL	2025-04-03T13:10:40.466Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/cd66838aa2f9bb98e101ef033f187133", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-X2YSAF", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/cd66838aa2f9bb98e101ef033f187133"}	\N	f	\N	\N	\N	f	\N
92	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-03T13:18:14.883Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/81b9d3d2e9415e434c82718e990a01a1", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-JYMVZK", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/81b9d3d2e9415e434c82718e990a01a1"}	\N	f	\N	\N	\N	f	\N
94	1	sruba-stl.stl	15684	STL	2025-04-03T13:37:28.824Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/3a353a34890a87f9b98fb26c620a414e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-1PKTP-", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/3a353a34890a87f9b98fb26c620a414e"}	\N	f	\N	\N	\N	f	\N
96	1	sruba-stl.stl	15684	STL	2025-04-03T14:14:11.499Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/ef52c74158257e194933837c039f929b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-G3H-EP", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/ef52c74158257e194933837c039f929b"}	\N	f	\N	\N	\N	t	\N
100	1	sruba-stl.stl	15684	STL	2025-04-03T14:53:08.522Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/ae055d9d7fb21cc2a698524d7075ce5e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-JJRJNR", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/ae055d9d7fb21cc2a698524d7075ce5e"}	\N	f	\N	\N	\N	t	\N
102	1	sruba-stl.stl	15684	STL	2025-04-03T15:15:49.982Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/43a94e04cae7c62d1f41514c440a71ec", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-FRYHCJ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/43a94e04cae7c62d1f41514c440a71ec"}	\N	f	\N	\N	\N	t	\N
103	1	sruba-stl.stl	15684	STL	2025-04-03T15:38:13.442Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/c2f0633b621777b42eb649b2ca04693b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-OVOTH4", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/c2f0633b621777b42eb649b2ca04693b"}	\N	f	\N	\N	\N	t	\N
104	1	sruba-stl.stl	15684	STL	2025-04-03T15:59:41.141Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/91755ac72846bd52537692a41a2be565", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-GJMVS8", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/91755ac72846bd52537692a41a2be565"}	\N	f	\N	\N	\N	f	\N
105	1	sruba-stl.stl	15684	STL	2025-04-03T16:03:17.447Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/b743564eccabcada217f00b10a1b320a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-SYIEO1", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/b743564eccabcada217f00b10a1b320a"}	\N	f	\N	\N	\N	f	\N
106	1	sruba-stl.stl	15684	STL	2025-04-03T16:04:49.664Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/cdad3ffaaba833b9d031f8f8c3a84f17", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-DFSMMV", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/cdad3ffaaba833b9d031f8f8c3a84f17"}	\N	f	\N	\N	\N	f	\N
107	1	sruba-stl.stl	15684	STL	2025-04-03T16:06:30.761Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/96b82066175ea0bfd4afde68f2ca2fab", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-A25U80", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/96b82066175ea0bfd4afde68f2ca2fab"}	\N	f	\N	\N	\N	t	\N
110	1	sruba-stl.stl	15684	STL	2025-04-03T16:17:19.476Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/d289c6f380a4df56bb21ca1970b13108", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-R9U8MS", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/d289c6f380a4df56bb21ca1970b13108"}	\N	f	\N	\N	\N	t	\N
114	1	jaroma.stl	22384	STL	2025-04-03T16:25:22.845Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/62925823dd0cae62383a1a31b61ef704", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-Z2TCEN", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/62925823dd0cae62383a1a31b61ef704"}	\N	f	\N	\N	\N	t	\N
111	1	sruba-stl.stl	15684	STL	2025-04-03T16:18:19.986Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/e2d96b856069425888392dd9bfffb39a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-MYBYCC", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/e2d96b856069425888392dd9bfffb39a"}	\N	f	\N	\N	\N	f	\N
112	1	jaroma.stl	22384	STL	2025-04-03T16:22:27.557Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/63f73f865bb447b36d79544f900ed7b6", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-IMKK9H", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/63f73f865bb447b36d79544f900ed7b6"}	\N	f	\N	\N	\N	f	\N
113	1	jaroma.stl	22384	STL	2025-04-03T16:25:05.795Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/44e7e18a0153e5f9b8af364076531113", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-KKXDH4", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/44e7e18a0153e5f9b8af364076531113"}	\N	f	\N	\N	\N	f	\N
115	1	jaroma.stl	22384	STL	2025-04-03T16:31:09.445Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/39a843a1489986942b77e525c2c3513d", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-UWXBEH", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/39a843a1489986942b77e525c2c3513d"}	\N	f	\N	\N	\N	t	\N
119	1	jaroma.stl	22384	STL	2025-04-03T17:11:18.760Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/93c080634db59d0809a9255ce796eb90", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-WPMKSI", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/93c080634db59d0809a9255ce796eb90"}	\N	f	\N	\N	\N	t	\N
116	1	sruba-stl.stl	15684	STL	2025-04-03T16:57:47.312Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/8554d2006e6febad07891cb7253c43b0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-8ZFNRZ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/8554d2006e6febad07891cb7253c43b0"}	\N	f	\N	\N	\N	f	\N
117	1	sruba-stl.stl	15684	STL	2025-04-03T16:58:36.804Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/81de5506d6a0c114c742eefd37bdac63", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-JNICR_", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/81de5506d6a0c114c742eefd37bdac63"}	\N	f	\N	\N	\N	f	\N
118	1	sruba-stl.stl	15684	STL	2025-04-03T17:06:43.425Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/1f40a622785be9b81556d0b29dad4493", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ELL1QQ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/1f40a622785be9b81556d0b29dad4493"}	\N	f	\N	\N	\N	f	\N
108	1	sruba-stl.stl	15684	STL	2025-04-03T16:09:29.653Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/1105dd3c0517ade555d630ef097b7014", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-KNFKN3", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/1105dd3c0517ade555d630ef097b7014"}	\N	f	\N	\N	\N	t	\N
120	1	jaroma.stl	22384	STL	2025-04-03T17:16:55.606Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/76712217479836ef07ca28e35d8424b0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-WNGOFM", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/76712217479836ef07ca28e35d8424b0"}	\N	f	\N	\N	\N	f	\N
121	1	jaroma.stl	22384	STL	2025-04-03T17:20:33.093Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/8a1e3c40384fae3a9e7d2011c85edb4c", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-AAB5ST", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/8a1e3c40384fae3a9e7d2011c85edb4c"}	pCDirxwpKy	f	\N	\N	glyzwinski@gmail.com	t	\N
109	1	sruba-stl.stl	15684	STL	2025-04-03T16:10:21.273Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/2e6dc23c54a72d490a28a9599dca6a8b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-DZOCZL", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/2e6dc23c54a72d490a28a9599dca6a8b"}	\N	f	\N	\N	\N	t	\N
126	1	ASUS TUF RTX 3070 ti.stl	43304884	STL	2025-04-03T19:44:17.361Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/fb114ce5b8e67b78338cf58b6fea0ef1", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-WZ0ZQJ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/fb114ce5b8e67b78338cf58b6fea0ef1"}	\N	f	\N	\N	\N	t	\N
122	1	jaroma.stl	22384	STL	2025-04-03T17:44:35.032Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/9da4ff4dc9fc247a5f37c13257ad03fb", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-C6Q-DV", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/9da4ff4dc9fc247a5f37c13257ad03fb"}	\N	f	\N	\N	\N	t	\N
125	1	ASUS TUF RTX 3070 ti.stp	17747834	STEP	2025-04-03T19:43:14.160Z	Unknown	{"parts": 39, "format": "STEP", "solids": 39, "filePath": "/tmp/step-uploads/fad9911fa8075211f837fa50affc1e4a", "surfaces": 283, "assemblies": 23, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-1T4U-O", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
128	1	wygeneruj-model-prostok-ta-z-otworem-w-srodku-o-srednicy-4-mm-jeden-z-bokow-prostok-ta-to-63-mm-wszystkie-katy-rowne.stl	28799	STL	2025-04-03T19:54:09.232Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/d68821c9e8c20c56f81b0a09e3ff82c0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ISZMZ1", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/d68821c9e8c20c56f81b0a09e3ff82c0"}	\N	f	\N	\N	\N	t	\N
127	1	ASUS TUF RTX 3070 ti.stl	43304884	STL	2025-04-03T19:52:57.643Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/324525d35c000a57e8acac0aa350809c", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-CC-8HG", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/324525d35c000a57e8acac0aa350809c"}	\N	f	\N	\N	\N	f	\N
129	1	Projekt do wycinki.dxf	909034	DXF	2025-04-03T19:59:28.764Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/4b0c0829a4ec3f2048dcfbe514ca9643", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-LRGSSJ"}}	\N	f	\N	\N	\N	f	\N
130	1	baza2_pozycja.dxf	3414	DXF	2025-04-03T19:59:45.921Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/0c5b2bd29936d31ae02d5575c4a307e9", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-SF6VYQ"}}	\N	f	\N	\N	\N	f	\N
131	1	nowy-element.dxf	269149	DXF	2025-04-03T20:00:11.657Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/7e54c970cec6814e20c88683859fa5af", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-AOPOHU"}}	\N	f	\N	\N	\N	f	\N
132	1	versace.dxf	4240203	DXF	2025-04-03T20:00:56.376Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/1d2dbfba8e0de2cc740f5b4f3cb019f8", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-GRXFEG"}}	\N	f	\N	\N	\N	f	\N
133	1	gniazdo kola tyl_v_02_3mm.dxf	49505	DXF	2025-04-03T20:01:23.170Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/293f809261d8497a2f6c5fc492a37a05", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-L560FU"}}	\N	f	\N	\N	\N	f	\N
134	1	CzÄÅÄ11.dxf	183610	DXF	2025-04-03T20:01:48.661Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/13125abc5675da5b3d0945b9e8d38f6e", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-Q_NG8-"}}	\N	f	\N	\N	\N	f	\N
135	1	LASER PodkÅadka regulacyjna.dwg	63018	DWG	2025-04-03T20:02:31.914Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/b594c6adea8857397bf27dcd0e9e10fd", "fileType": "2d", "cadFormat": "dwg", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DWG-KAOK9S"}}	\N	f	\N	\N	\N	f	\N
136	1	fasola_x2_2nd.dxf	2630	DXF	2025-04-03T20:02:50.701Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/c9c753bdffe0a6d1e476a9bbb2f78e1d", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-PGYT4E"}}	\N	f	\N	\N	\N	f	\N
137	1	baza2_pozycja.dxf	3414	DXF	2025-04-03T20:03:02.182Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/3bcaad0eb7dce745ee27eb3c81955a9f", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-J_P42E"}}	\N	f	\N	\N	\N	f	\N
138	1	Rampy_zwykÅe_1.5.dxf	118569	DXF	2025-04-03T20:03:32.913Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/441e04bdb1cfe9314be4d90c9b043f94", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-CL7-A8"}}	\N	f	\N	\N	\N	f	\N
123	1	Corsair RM750.STL	16302484	STL	2025-04-03T18:42:45.217Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/e5e4dc6d71219eef8e1ba93c87013430", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-8BWJ2L", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/e5e4dc6d71219eef8e1ba93c87013430"}	\N	f	\N	\N	\N	t	\N
139	1	p1.dxf	669973	DXF	2025-04-03T20:03:54.702Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/0ddf2236d09d4c2c76b8534f2054a97b", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-NUV-FL"}}	\N	f	\N	\N	\N	f	\N
142	1	AsRock H310M-HDVM.stl	2161784	STL	2025-04-03T20:10:09.152Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/7163f5c1c1e6b6aa9c43364539a9359c", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-2VR2AP", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/7163f5c1c1e6b6aa9c43364539a9359c"}	\N	f	\N	\N	\N	t	\N
141	1	Excenter 4.2pen v20.step	293715	STEP AP242	2025-04-03T20:09:42.372Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/96cd8c21ee02f87e4ad050301f76cf1b", "surfaces": 26, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-RROF0B", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
143	1	ASUS TUF RTX 3070 ti.stl	43304884	STL	2025-04-03T20:12:06.021Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/14a212db68b84fecc954808d29617c19", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-PFUKR6", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/14a212db68b84fecc954808d29617c19"}	\N	f	\N	\N	\N	f	\N
140	1	Corsair RM750.STL	16302484	STL	2025-04-03T20:04:43.175Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/67b06fd09888fb399d19dbc285917799", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-7OLBBM", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/67b06fd09888fb399d19dbc285917799"}	\N	f	\N	\N	\N	t	\N
145	1	ASUS TUF RTX 3070 ti.stp	17747834	STEP	2025-04-03T20:24:46.317Z	Unknown	{"parts": 39, "format": "STEP", "solids": 39, "filePath": "/tmp/step-uploads/044a72d8a283624ee30dd17121409351", "surfaces": 283, "assemblies": 23, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-EAELKW", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
146	1	FR.00_14-2 (1).step	33201	STEP	2025-04-03T20:28:45.283Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/735534fa514f60316adc8f699f1ea987", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-HE-CP2", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
147	1	Excenter 4.2pen v20.step	293715	STEP AP242	2025-04-03T20:30:05.606Z	Unknown	{"parts": 1, "format": "STEP AP242", "solids": 1, "filePath": "/tmp/step-uploads/b79203998db6a50b23fc4b9269b712eb", "surfaces": 26, "assemblies": 1, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-HLJ0UT", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
148	1	Corsair RM750.STL	16302484	STL	2025-04-03T20:30:45.015Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/a947b48401cdbab9b9496c63be86af0b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-RBIC7Z", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/a947b48401cdbab9b9496c63be86af0b"}	\N	f	\N	\N	\N	f	\N
149	1	jaroma.stl	22384	STL	2025-04-04T09:59:29.704Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/76d0516b5082201578a845e9f84dafe2", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-1-UQ-I", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/76d0516b5082201578a845e9f84dafe2"}	\N	f	\N	\N	\N	f	\N
150	1	jaroma.stl	22384	STL	2025-04-04T10:00:11.704Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/01548e9ad340699364b3480111a9f197", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-4_JBAF", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/01548e9ad340699364b3480111a9f197"}	\N	f	\N	\N	\N	f	\N
144	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-03T20:16:25.193Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/23f01d4773a6349d5f110595842aa913", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ZDXK6P", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/23f01d4773a6349d5f110595842aa913"}	\N	f	\N	\N	\N	t	\N
152	1	sruba-stl.stl	15684	STL	2025-04-04T10:07:02.485Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/afdbf1a794b9ab66144e44d4c1a4013c", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL--REMPE", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/afdbf1a794b9ab66144e44d4c1a4013c"}	\N	f	\N	\N	\N	f	\N
153	1	sruba-stl.stl	15684	STL	2025-04-04T10:13:03.778Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/77264129caa4836ad0ba3b26ef141aa8", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-COAVY9", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/77264129caa4836ad0ba3b26ef141aa8"}	\N	f	\N	\N	\N	f	\N
154	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-1.step	55588	STEP	2025-04-04T10:13:45.489Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/b9d6ab15c1b89b5b7bd3641ecd96cb90", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-HSGD3T", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
155	1	podstawka-cc.stp	65598	STEP	2025-04-04T10:14:36.941Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/73870ed8d4c8b19918f1348aec0b1e76", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-PEKXW2", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
156	1	baza_mocowania (1).dxf	41921	DXF	2025-04-04T10:14:50.609Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/a2ee20f33b59e3f6bf98dedfeef2d16a", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-2MXHKH"}}	\N	f	\N	\N	\N	f	\N
157	1	podporka.dxf	267945	DXF	2025-04-04T10:15:09.677Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/a328a70af7e3387e73445472d67918f3", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-RYHMLK"}}	\N	f	\N	\N	\N	f	\N
158	1	zaslepka.stp	19212	STEP	2025-04-04T10:15:42.303Z	Unknown	{"parts": 1, "format": "STEP", "solids": 1, "filePath": "/tmp/step-uploads/5411475da377d6ca45d02712f57bee6c", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-G7IMUD", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
160	1	zacisk.iges	25420	STEP	2025-04-04T10:33:15.027Z	Unknown	{"parts": 5, "format": "STEP", "solids": 5, "filePath": "/tmp/step-uploads/f51bb002029d68311408a0f62b3b98e2", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-9-ITT-", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
161	1	zacisk.iges	25420	STEP	2025-04-04T10:34:07.352Z	Unknown	{"parts": 5, "format": "STEP", "solids": 5, "filePath": "/tmp/step-uploads/57636c0a2e7ac21d77e445ada0f42cbf", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-HTXSGC", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
162	1	zacisk.iges	25420	STEP	2025-04-04T10:37:51.272Z	Unknown	{"parts": 5, "format": "STEP", "solids": 5, "filePath": "/tmp/step-uploads/a6bf8d0ffc96427e8d955a13e1f0448b", "surfaces": 10, "assemblies": 2, "properties": {"author": "Unknown", "revision": "A", "partNumber": "STEP-ITLDG9", "organization": "Unknown"}, "sourceSystem": "Unknown", "conversionError": "STL file was not created", "conversionStatus": "failed"}	\N	f	\N	\N	\N	f	\N
163	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-04T12:15:49.065Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/c3fe502509beb8c9860ce4b90b246001", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-XMBWXO", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/c3fe502509beb8c9860ce4b90b246001"}	\N	f	\N	\N	\N	f	\N
164	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-04T12:31:01.154Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/039750cc035d6e95c1888b0e2e239c9e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-YSZUJV", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/039750cc035d6e95c1888b0e2e239c9e"}	\N	f	\N	\N	\N	f	\N
165	1	ramka.dxf	54861	DXF	2025-04-05T19:28:51.712Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/a92ee82c10c907dd97b445363118113f", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-AGHRNI"}}	\N	f	\N	\N	\N	f	\N
166	1	Corsair RM750.STL	16302484	STL	2025-04-05T19:29:31.732Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/26aa0a86ad8844358835e8575930ce48", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-BZ7ULZ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/26aa0a86ad8844358835e8575930ce48"}	\N	f	\N	\N	\N	f	\N
167	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-05T19:30:55.600Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/17e98e27d08d8e9549cfde43c5606549", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-JZIVGC", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/17e98e27d08d8e9549cfde43c5606549"}	\N	f	\N	\N	\N	f	\N
168	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-06T08:27:17.481Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/50c82ade8a6f0c7f3c7218d427cb144e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-DMK7FQ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/50c82ade8a6f0c7f3c7218d427cb144e"}	\N	f	\N	\N	\N	f	\N
179	1	Corsair RM750.STL	16302484	STL	2025-04-12T07:44:19.208Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/c1054a4fda7c0d02a9de233215a83754", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-IKRD6N", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/c1054a4fda7c0d02a9de233215a83754"}	\N	f	\N	\N	\N	f	\N
177	1	blacha 1.stl	6284	STL	2025-04-09T11:14:38.437Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/a96308c99ce4ba453fd146aab7b9148a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-KG6HH_", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/a96308c99ce4ba453fd146aab7b9148a"}	\N	f	\N	\N	\N	f	\N
170	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-06T08:53:42.801Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/2de7b9e81ac0845df76ac88e93a47099", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-NRV7OI", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/2de7b9e81ac0845df76ac88e93a47099"}	5Igr3Xv3uQ	f	$2b$10$tHNOOKCW1SX1b4sN18szg.JycPRr9cCitZ5qd4qG7ZItuGt5dK0BG	2025-04-09	glyzwinski@gmail.com	t	\N
171	1	baza_mocowania (1).dxf	41921	DXF	2025-04-07T11:15:23.191Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/01d38f6a5671cc131db5d9696d3cd32d", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-XNCJYA"}}	\N	f	\N	\N	\N	f	\N
172	1	baza_mocowania.dxf	41921	DXF	2025-04-07T11:15:41.950Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/c8baea002ae23ecc4ad4cf548afd55cd", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-9GDCUY"}}	\N	f	\N	\N	\N	f	\N
173	1	rys-1.dxf	270173	DXF	2025-04-07T11:15:56.885Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/8f043a96bf1fce815bc4f0996ccc0a7b", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-2WPVJQ"}}	\N	f	\N	\N	\N	f	\N
174	1	jaroma.stl	22384	STL	2025-04-07T11:16:12.297Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/98078807cc19eefdcf878b4ee2979ba4", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-XBQD40", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/98078807cc19eefdcf878b4ee2979ba4"}	\N	f	\N	\N	\N	f	\N
175	1	ramka.dxf	54861	DXF	2025-04-07T18:53:46.325Z	direct_upload	{"layers": 0, "entities": 0, "filePath": "/tmp/cad-uploads/53c5d097972ce530c47dec2af6bda68a", "fileType": "2d", "cadFormat": "dxf", "properties": {"author": "User", "revision": "A", "organization": "Direct Upload", "drawingNumber": "DXF-HXYYO7"}}	\N	f	\N	\N	\N	f	\N
180	1	Corsair RM750.STL	16302484	STL	2025-04-12T07:44:52.413Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/0a6ce8cdbf63ce04dab9586496ffccca", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-FEMP9S", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/0a6ce8cdbf63ce04dab9586496ffccca"}	\N	f	\N	\N	\N	f	\N
176	1	SteelWebINC-Logo_Z.stl	735384	STL	2025-04-08T17:35:18.302Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/17edda7b18ad1e23e7b4c9cdacfd235a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-EBNVES", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/17edda7b18ad1e23e7b4c9cdacfd235a"}	\N	f	\N	\N	\N	t	\N
88	1	sruba-stl.stl	15684	STL	2025-04-03T12:55:27.960Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/d063384124c7bfe381c076a93d96d4a6", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-1XPDQT", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/d063384124c7bfe381c076a93d96d4a6"}	\N	f	\N	\N	\N	f	\N
169	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-06T08:48:07.304Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f2889915fd3adc509946b3f14d3f89fc", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-DEZ-XZ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f2889915fd3adc509946b3f14d3f89fc"}	\N	f	\N	\N	\N	t	\N
159	1	jaroma.stl	22384	STL	2025-04-04T10:17:36.746Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/bd5e13ed37426969e916dab450838dca", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-DVQ6YW", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/bd5e13ed37426969e916dab450838dca"}	\N	f	\N	\N	\N	t	\N
151	1	jaroma.stl	22384	STL	2025-04-04T10:00:29.950Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/acaeb92b8e1bd229779ac0726923693e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-SSJHJH", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/acaeb92b8e1bd229779ac0726923693e"}	\N	f	\N	\N	\N	t	\N
124	1	ASUS TUF RTX 3070 ti.stl	43304884	STL	2025-04-03T19:33:23.754Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/e88fd048af70be5208374bdde513870a", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-LXLS3I", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/e88fd048af70be5208374bdde513870a"}	\N	f	\N	\N	\N	t	\N
178	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-12T07:42:20.894Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/3ab38cf9511781ec3512e51ef02bd661", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-1HFOPU", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/3ab38cf9511781ec3512e51ef02bd661"}	\N	f	\N	\N	\N	f	\N
181	1	Corsair RM750.STL	16302484	STL	2025-04-12T09:46:14.555Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/40460febac378dd9bb8cdaa38967542b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-CE4HIL", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/40460febac378dd9bb8cdaa38967542b"}	\N	f	\N	\N	\N	t	\N
182	1	Corsair RM750.STL	16302484	STL	2025-04-12T10:41:50.253Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/651d7ec0cee359012039306b9bfeb734", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ARB4ZT", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/651d7ec0cee359012039306b9bfeb734"}	3fgpj1W0Jv	t	$2b$10$XyBUlOmgwKNJyBNQtl.I8eaJTwtR7Yf70FrJRo.FAD38LudO8Ycf2	2025-04-23	glyzwinski@gmail.com	t	\N
184	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-12T10:51:56.058Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/3d7dcb9911da9415e67967b103679d97", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-PDBAKJ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/3d7dcb9911da9415e67967b103679d97"}	azaOgkNiEB	t	$2b$10$B.YZsyopWhVZTm9rekkituBZP.8TAhztSvcesT4o1raFaIz9gwd8y	\N	cncilawa@gmail.com	t	\N
183	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-12T10:48:11.813Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/25258eb4b03b55ee9683513cc0e83c08", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-VA-JID", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/25258eb4b03b55ee9683513cc0e83c08"}	E0ZEstEsI_	t	$2b$10$T1BaY8HYRsTCJ470bqL3fu1WvenLmGwVcO3AFPs9sBJJjD9bb/FEK	\N	glyzwinski@gmail.com	t	\N
185	1	Dragon 2.5_stl.stl	1899384	STL	2025-04-12T10:55:21.802Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/5f60a589ea1acc108d45efe9b7e9bff4", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-XBNL3-", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/5f60a589ea1acc108d45efe9b7e9bff4"}	5BzBwNJ4DT	t	$2b$10$E1j/TNN2WAVmAzM0Wy5xIu.MmLw3d64E1M/bWNcI650GUnlRLNtfC	\N	glyzwinski@gmail.com	t	\N
186	1	blacha 1.stl	6284	STL	2025-04-12T12:28:37.534Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/1c1f3487c8e5224b1b24dec9b1a2a7f0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-PU_RO5", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/1c1f3487c8e5224b1b24dec9b1a2a7f0"}	F_27z-XZX6	t	$2b$10$ssQDeWLX8Zp9jdeEXl7zpuwcfO2yvnP9Fkxw0zsWRHSw1ClU.9w7i	\N	glyzwinski@gmail.com	t	\N
187	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T13:01:15.831Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/40eed42ae58e70686d481e36789468be", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-RZPPKX", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/40eed42ae58e70686d481e36789468be"}	OZPymCYaro	t	$2b$10$vC2Y2Q5SwF8PnTavdrXUW.LTGl57Vf7ULzXWVbZz9nGbRg0nOpsla	\N	glyzwinski@gmail.com	t	\N
194	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:28:39.979Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/df01a9eba9b5820c0b46086c315369e9", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-VO-7NU", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/df01a9eba9b5820c0b46086c315369e9"}	5o8vxiYOuP	t	$2b$10$Mu6f7O5RHl8qGsr4UASoiu9Q9Omrt7kAXDoiqH.TgJLaOa0JhguSi	2025-04-17	xkorki@gmail.com	t	\N
189	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T13:41:07.370Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f318cb33fc3c062b66cc57327d7082d8", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-E_ZLBJ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f318cb33fc3c062b66cc57327d7082d8"}	QQRSxYFTfl	t	$2b$10$Yg.7Xsku3W1bElTxDVDPMO7BOBRJJILVgrq5zpyvaeTRuLZuCjik2	2025-04-16	cnc.ilawa@gmail.com	t	\N
188	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T13:04:07.117Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/92a889eb40cc29dd1b92c177d67804fb", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-XPKTZD", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/92a889eb40cc29dd1b92c177d67804fb"}	yfzGxCGB9C	t	$2b$10$SUduFW00YjhC8j7mnMvseuRBkTRdMrrWl2JR90l9VTyTL9g1t3rMG	\N	cncilawa@gmail.com	t	\N
190	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T14:15:29.442Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/a6a02beaa10ed50d5860e6504dbcca10", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ZSLN8C", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/a6a02beaa10ed50d5860e6504dbcca10"}	\N	f	\N	\N	\N	f	\N
191	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T14:19:56.871Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/5f4284abf4b5e85c5f0f170d9821ecc6", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-LS_84W", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/5f4284abf4b5e85c5f0f170d9821ecc6"}	\N	f	\N	\N	\N	f	\N
192	1	wygeneruj-okr-g-o-srednicy-250-mm-w-srodku-okregu-zrob-kwadratowy-orag-o-wymiarach-40-x-40-mm-po-jednej-stronie-otworu-stworz-serie-trujkatnych-otworow-oddalonych-od-siebie-o-10-mm-wysokosc-trujkata-rownobocznego-to-12.stl	98402	STL	2025-04-12T14:20:55.944Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/55b0d7a9bac97279581d660fc95391d3", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-_O_Z6C", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/55b0d7a9bac97279581d660fc95391d3"}	\N	f	\N	\N	\N	f	\N
193	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:24:59.381Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f946da586e32496d64eca40020ba1053", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-Q4XE1U", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f946da586e32496d64eca40020ba1053"}	\N	f	\N	\N	\N	f	\N
195	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:30:12.187Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/6b8a936ef46bfb57fa2ed02ffbaf164d", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-GXEPTZ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/6b8a936ef46bfb57fa2ed02ffbaf164d"}	YVZCRPWgma	t	\N	\N	glyzwinski@gmail.com	t	\N
196	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:47:12.010Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/94a5e8e265ccb1e78abc34b480a76c64", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-FZH73E", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/94a5e8e265ccb1e78abc34b480a76c64"}	an5kESsglq	t	$2b$10$j3hiAKisGQrQNrY9gBM6r.JnuuhFEjIWeVEZs.xB.jikm0npnkhyi	\N	glyzwinski@gmail.com	t	\N
197	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:47:54.722Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/ca6dab168e369173de3657a3480e583b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ZZNDE2", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/ca6dab168e369173de3657a3480e583b"}	ZAxko9gId9	t	$2b$10$bBB7gTl6/nyVQaBkfaWB7e5itf9W.OYX/Lfsa/xPllHBdltQ258XC	2025-04-24	xkorki@gmail.com	t	\N
198	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:49:41.453Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/560f93fb700a3520b4f220f0a469aaef", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-E8EVQH", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/560f93fb700a3520b4f220f0a469aaef"}	ZRQJDesdgn	t	$2b$10$cnJ/m2w6Wc0E4MBa6Oyrs.fGParPqpfCjdqhq1ExVtJOoBBnN8FxK	\N	xkorki@gmail.com	t	\N
199	1	Sink_Strainer.stl	613284	STL	2025-04-12T14:50:38.402Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/a3519c4b6235613b558263e6df7606f0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-MPENF_", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/a3519c4b6235613b558263e6df7606f0"}	yMY8sG5xOf	t	$2b$10$GSRfeaLgUazwPm8ytTPQ2u1OFGdRmvoCvhZrys370YlMQa48vSUli	\N	glyzwinski@gmail.com	t	\N
200	1	Sink_Strainer.stl	613284	STL	2025-04-12T15:12:48.336Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f37a4798d05730086fce1014b22a02c1", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-3P21B-", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f37a4798d05730086fce1014b22a02c1"}	25-a42K3vi	t	$2b$10$0POBXvyCQPJHOMj0N0lQNOgEEU6h9XEIMGrdWsMQfbZebSe3BP0RS	\N	glyzwinski@gmail.com	t	\N
201	1	Sink_Strainer.stl	613284	STL	2025-04-12T15:21:20.856Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/96f48bd228ec89484d1bd7935112e7ca", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-T57FBY", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/96f48bd228ec89484d1bd7935112e7ca"}	4ZbdIFUBA4	t	$2b$10$DbC1KPFMKFvHXbMIA8JJ4.uw/pULUQwl7nYDJQ8atxbUjw5CT2t0.	\N	glyzwinski@gmail.com	t	\N
202	1	Sink_Strainer.stl	613284	STL	2025-04-12T15:30:41.876Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/80aae9033193497881f344ebc39116a6", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-CIPTQR", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/80aae9033193497881f344ebc39116a6"}	hLqw4M2md7	t	$2b$10$N5rerNaqJJAgDU2prUTIGuFOCLVn9O6vUE4CM1Q2CPw.WWp.Ncx3K	\N	glyzwinski@gmail.com	t	\N
203	1	Sink_Strainer.stl	613284	STL	2025-04-12T15:41:53.356Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/61a42d637832be59c28e23526ae2b504", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-H3IR5O", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/61a42d637832be59c28e23526ae2b504"}	v82ZaEfqQG	t	$2b$10$WqGZj24M7wnjNxYcF.5qk.rGEphqb/YLEXq8JH/4oGJB.2sTvYJAa	\N	glyzwinski@gmail.com	t	\N
204	1	Sink_Strainer.stl	613284	STL	2025-04-12T15:55:01.375Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/31fb9c24d7b3d6e96093609fc7fee04e", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-RQYI9E", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/31fb9c24d7b3d6e96093609fc7fee04e"}	lsSNb_HiYG	t	$2b$10$aeEI/K4MUAGL0egJwyX4CuhxceHC7ml/ad9w5I8TUZTRGJFj4FRJm	\N	glyzwinski@gmail.com	t	\N
206	1	60x60x4_2.stl	243184	STL	2025-04-16T10:56:08.266Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/f36544cf72f0710bcc4dce8e7921aee0", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-3YXRW7", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/f36544cf72f0710bcc4dce8e7921aee0"}	SA-4z1IBzl	t	$2b$10$AuM0GnvoZshuGsMGgqRDieN1JX4.LmSjbsS/ADDUhcuLJ2lLdnG.y	\N	glyzwinski@gmail.com	t	\N
208	1	60x60x4_2.stl	243184	STL	2025-04-16T10:59:26.450Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/05bd5cb191fd62bba595c4d6b2ba573f", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-ODP8NH", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/05bd5cb191fd62bba595c4d6b2ba573f"}	V4ERIGDtVK	t	$2b$10$w3Y.uiNLebjg6GXyVS8mT.ov/umesvoALJK4MPEdT1BeTKm0iOHR.	\N	glyzwinski@gmail.com	t	2025-04-16T12:36:00.870Z
207	1	blacha-lewa.stl	3084	STL	2025-04-16T10:58:26.497Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/cd2dde06394cd5bf7e912d29fef4f577", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-D1V7OM", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/cd2dde06394cd5bf7e912d29fef4f577"}	VXVEuJ6NzL	t	$2b$10$1ouTxgBeQX/SKSt6d/4fSOBtAuu9DsVs..nsERuisgInNqlmWj3Bm	\N	glyzwinski@gmail.com	t	\N
209	1	60x60x4_2.stl	243184	STL	2025-04-16T11:10:07.155Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/3dc013c891b585265213521da06c7fc4", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-7PCWGH", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/3dc013c891b585265213521da06c7fc4"}	399rafFVoU	t	$2b$10$f5WPYqdezOceaMziS9a2I.VZ6rM1jIedY5yrxJsggY4qBrGjyd34a	\N	glyzwinski@gmail.com	t	2025-04-16T11:22:56.883Z
205	1	blacha-lewa.stl	3084	STL	2025-04-16T08:51:06.276Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/27063ce92adf31d466e5a61e3996073d", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-GWKABV", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/27063ce92adf31d466e5a61e3996073d"}	celiiMF_d-	t	$2b$10$/0U97RrVlNyuoWCVrufweOunpnvnFaLfAw6Xb2qdtNMaTDWCVjnIy	2025-04-18	artur.kalinowski@tds-alu.pl	t	2025-04-16T12:40:51.016Z
210	1	60x60x4_2.stl	243184	STL	2025-04-16T11:36:16.256Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/0d428164e5a6ae593fd081b20259cb35", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-0CRTT-", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/0d428164e5a6ae593fd081b20259cb35"}	li7yWOkf4p	t	$2b$10$baq0049m..MfH0zoDxr9X.zuIuv9kbo60mHxWbkb9aFl4q56m6EJC	\N	glyzwinski@gmail.com	t	2025-04-16T12:34:36.346Z
211	1	blacha 1.stl	6284	STL	2025-04-16T12:34:50.206Z	direct_upload	{"parts": 1, "solids": 1, "filePath": "/tmp/stl-uploads/2053d25d9df86a9fc89115137269a27b", "surfaces": 10, "assemblies": 1, "properties": {"author": "User", "revision": "A", "partNumber": "STL-7NCZOQ", "organization": "Direct Upload"}, "isDirectStl": true, "stlFilePath": "/tmp/stl-uploads/2053d25d9df86a9fc89115137269a27b"}	xGH77kzSz9	t	$2b$10$ekKNoxoXMSfwNOWPu6mWHOViN6xzjN4Md07B/z4EBVyMbPANUgCJK	\N	glyzwinski@gmail.com	t	2025-04-16T12:35:33.742Z
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, is_admin) FROM stdin;
1	test	test123	f
2	admin	$2b$10$e0w8D5Ghw9QclrgmiiuKa.oPkGOeg1G3kDb0USjNKf1QXPy27p5TK	t
\.


--
-- Name: model_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.model_views_id_seq', 33, true);


--
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.models_id_seq', 211, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: model_views model_views_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.model_views
    ADD CONSTRAINT model_views_pkey PRIMARY KEY (id);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: models models_share_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_share_id_key UNIQUE (share_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: model_views_ip_address_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX model_views_ip_address_idx ON public.model_views USING btree (ip_address);


--
-- Name: model_views_model_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX model_views_model_id_idx ON public.model_views USING btree (model_id);


--
-- Name: model_views_share_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX model_views_share_id_idx ON public.model_views USING btree (share_id);


--
-- Name: model_views_viewed_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX model_views_viewed_at_idx ON public.model_views USING btree (viewed_at);


--
-- Name: models models_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

