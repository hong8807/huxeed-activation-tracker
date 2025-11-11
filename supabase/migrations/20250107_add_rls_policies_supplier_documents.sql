-- Enable RLS on supplier_documents table
alter table supplier_documents enable row level security;

-- Allow authenticated users to insert documents
create policy "Allow authenticated users to insert supplier documents"
  on supplier_documents for insert
  to authenticated
  with check (true);

-- Allow authenticated users to select documents
create policy "Allow authenticated users to select supplier documents"
  on supplier_documents for select
  to authenticated
  using (true);

-- Allow authenticated users to update documents
create policy "Allow authenticated users to update supplier documents"
  on supplier_documents for update
  to authenticated
  using (true);

-- Allow authenticated users to delete documents
create policy "Allow authenticated users to delete supplier documents"
  on supplier_documents for delete
  to authenticated
  using (true);
