-- Un hogar con recetas propias que usan productos propios no se podía borrar: el borrado en
-- cascada llegaba a los productos antes que a las recetas, y ON DELETE RESTRICT lo frena en el
-- acto. La regla ahora se revisa al confirmar la transacción, cuando las recetas ya se fueron;
-- borrar un producto que sigue en una receta sigue sin poderse.
alter table public.recipe_ingredients
  drop constraint recipe_ingredients_ingredient_id_fkey,
  add constraint recipe_ingredients_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients (id)
    on delete no action deferrable initially deferred;
