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

