import {
  Button,
  Form,
  Host,
  LabeledContent,
  Picker,
  Section,
  Text,
  TextField,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  disabled,
  foregroundStyle,
  keyboardType,
  listSectionMargins,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useRef, useState } from 'react';

import { ProductInput } from '@/database';

import { DeleteProductAlert } from './delete-product-alert';

type ProductFormProps = {
  initialValues?: Partial<ProductInput>;
  submitLabel?: string;
  onSubmit: (product: ProductInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

const numberFields = [
  ['basisAmount', 'Basis amount'],
  ['servingAmount', 'Serving amount'],
  ['energyKj', 'Energy (kJ)'],
  ['energyKcal', 'Energy (kcal)'],
  ['fatG', 'Fat (g)'],
  ['saturatedFatG', 'Saturated fat (g)'],
  ['carbohydratesG', 'Carbohydrates (g)'],
  ['sugarsG', 'Sugars (g)'],
  ['fibreG', 'Fibre (g)'],
  ['proteinG', 'Protein (g)'],
  ['saltG', 'Salt (g)'],
  ['sodiumMg', 'Sodium (mg)'],
] as const;

type NumberField = (typeof numberFields)[number][0];

function initialNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;

  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function initialUnit(
  values: Partial<ProductInput>
): ProductInput['servingUnit'] {
  if (values.basisUnit === 'g' || values.basisUnit === 'ml') {
    return values.basisUnit;
  }

  return values.servingUnit ?? 'g';
}

function NutrientField({
  label,
  text,
}: {
  label: string;
  text: NonNullable<React.ComponentProps<typeof TextField>['text']>;
}) {
  const inputRef = useRef<TextFieldRef>(null);

  return (
    <LabeledContent
      label={
        <Button
          label={label}
          onPress={() => void inputRef.current?.focus()}
          modifiers={[
            buttonStyle('borderless'),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}
        />
      }
    >
      <TextField
        ref={inputRef}
        text={text}
        placeholder="0"
        modifiers={[keyboardType('decimal-pad')]}
      />
    </LabeledContent>
  );
}

export function ProductForm({
  initialValues = {},
  submitLabel = 'Save product',
  onSubmit,
  onDelete,
}: ProductFormProps) {
  const code = useNativeState(initialValues.code ?? '');
  const name = useNativeState(initialValues.name ?? '');
  const basisAmount = useNativeState(initialNumber(initialValues.basisAmount));
  const servingAmount = useNativeState(
    initialNumber(initialValues.servingAmount)
  );
  const energyKj = useNativeState(initialNumber(initialValues.energyKj));
  const energyKcal = useNativeState(initialNumber(initialValues.energyKcal));
  const fatG = useNativeState(initialNumber(initialValues.fatG));
  const saturatedFatG = useNativeState(
    initialNumber(initialValues.saturatedFatG)
  );
  const carbohydratesG = useNativeState(
    initialNumber(initialValues.carbohydratesG)
  );
  const sugarsG = useNativeState(initialNumber(initialValues.sugarsG));
  const fibreG = useNativeState(initialNumber(initialValues.fibreG));
  const proteinG = useNativeState(initialNumber(initialValues.proteinG));
  const saltG = useNativeState(initialNumber(initialValues.saltG));
  const sodiumMg = useNativeState(initialNumber(initialValues.sodiumMg));
  const [unit, setUnit] = useState<ProductInput['servingUnit']>(() =>
    initialUnit(initialValues)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const numericStates = {
    basisAmount,
    servingAmount,
    energyKj,
    energyKcal,
    fatG,
    saturatedFatG,
    carbohydratesG,
    sugarsG,
    fibreG,
    proteinG,
    saltG,
    sodiumMg,
  };

  const handleSubmit = async () => {
    const trimmedCode = code.get().trim();
    const trimmedName = name.get().trim();

    if (!trimmedCode || !trimmedName) {
      setError('Code and product name are required.');
      return;
    }

    const numbers = Object.fromEntries(
      numberFields.map(([field]) => [
        field,
        parseNumber(numericStates[field].get()),
      ])
    ) as Record<NumberField, number | null>;
    const invalidField = numberFields.find(
      ([field]) =>
        numericStates[field].get().trim() !== '' && numbers[field] === null
    );
    const missingField = numberFields
      .slice(0, 2)
      .find(([field]) => numbers[field] === null);

    if (invalidField) {
      setError(`${invalidField[1]} must be a non-negative number.`);
      return;
    }

    if (missingField) {
      setError(`${missingField[1]} must be a non-negative number.`);
      return;
    }

    const completedNumbers = Object.fromEntries(
      numberFields.map(([field], index) => [
        field,
        index >= 2 ? (numbers[field] ?? 0) : numbers[field],
      ])
    ) as Record<NumberField, number>;

    setError(null);
    setIsSaving(true);

    try {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        basisUnit: unit,
        servingUnit: unit,
        ...completedNumbers,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save product.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setError(null);
    setIsDeleting(true);

    try {
      await onDelete();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not delete product.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Product">
          <TextField text={name} placeholder="Product name" />
          <TextField text={code} placeholder="Barcode" />
        </Section>

        <Section title="Nutrition basis">
          <TextField
            text={basisAmount}
            placeholder="Basis amount"
            modifiers={[keyboardType('decimal-pad')]}
          />
          <Picker
            label="Basis unit"
            selection={unit}
            onSelectionChange={setUnit}
            modifiers={[pickerStyle('menu')]}
          >
            {(['g', 'ml'] as const).map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <TextField
            text={servingAmount}
            placeholder="Serving amount"
            modifiers={[keyboardType('decimal-pad')]}
          />
          <Picker
            label="Serving unit"
            selection={unit}
            onSelectionChange={setUnit}
            modifiers={[pickerStyle('menu')]}
          >
            {(['g', 'ml'] as const).map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section title="Nutrition values">
          {numberFields.slice(2).map(([field, label]) => (
            <NutrientField
              key={field}
              label={label}
              text={numericStates[field]}
            />
          ))}
        </Section>

        {error ? (
          <Section title="Please check the form">
            <Text>{error}</Text>
          </Section>
        ) : null}

        <Section
          modifiers={[
            ...(onDelete
              ? [listSectionMargins({ edges: 'bottom', length: 4 })]
              : []),
          ]}
        >
          <Button
            label={isSaving ? 'Saving…' : submitLabel}
            onPress={handleSubmit}
            modifiers={[disabled(isSaving || isDeleting)]}
          />
        </Section>

        {onDelete ? (
          <Section
            modifiers={[listSectionMargins({ edges: 'top', length: 4 })]}
          >
            <DeleteProductAlert onConfirm={handleDelete}>
              <Button
                label={isDeleting ? 'Deleting…' : 'Delete Product'}
                role="destructive"
                modifiers={[disabled(isSaving || isDeleting)]}
              />
            </DeleteProductAlert>
          </Section>
        ) : null}
      </Form>
    </Host>
  );
}
