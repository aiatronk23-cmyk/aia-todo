create or replace function public.example_function(input_text text)
returns text as $$
begin
    return 'Hello, ' || input_text || '!';
end;
$$ language plpgsql;