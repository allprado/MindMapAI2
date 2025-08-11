-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create mindmaps table
create table public.mindmaps (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_public boolean default false not null,
  tags text[] default '{}'::text[]
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Enable RLS for mindmaps
alter table public.mindmaps enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create policies for mindmaps
create policy "Users can view their own mindmaps"
  on mindmaps for select
  using ( auth.uid() = user_id );

create policy "Users can view public mindmaps"
  on mindmaps for select
  using ( is_public = true );

create policy "Users can insert their own mindmaps"
  on mindmaps for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own mindmaps"
  on mindmaps for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own mindmaps"
  on mindmaps for delete
  using ( auth.uid() = user_id );

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_mindmaps_updated_at
  before update on public.mindmaps
  for each row execute procedure public.update_updated_at_column();

-- Create indexes for better performance
create index mindmaps_user_id_idx on public.mindmaps(user_id);
create index mindmaps_created_at_idx on public.mindmaps(created_at desc);
create index mindmaps_is_public_idx on public.mindmaps(is_public);
create index mindmaps_tags_idx on public.mindmaps using gin(tags);
