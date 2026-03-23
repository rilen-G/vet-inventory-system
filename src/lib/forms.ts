import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";

type ZodFormValues<TSchema extends z.ZodTypeAny> = z.output<TSchema> & FieldValues;

export function useZodForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  defaultValues?: DefaultValues<ZodFormValues<TSchema>>,
) {
  return useForm<ZodFormValues<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}
