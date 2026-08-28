import {
  Button,
  Host,
  HStack,
  List,
  ProgressView,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  lineLimit,
  truncationMode,
} from '@expo/ui/swift-ui/modifiers';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { getProducts, Product } from '@/database';

type ProductSection = {
  title: string;
  products: Product[];
};

function sectionTitle(name: string): string {
  const initial = name.trim().charAt(0).toLocaleUpperCase();
  return initial || '#';
}

function ProductRow({ product }: { product: Product }) {
  const openProduct = () => {
    router.push({
      pathname: '/products/log',
      params: { id: product.id },
    });
  };
  const editProduct = () => {
    router.push({
      pathname: '/products/edit',
      params: { id: product.id },
    });
  };

  return (
    <HStack spacing={12} alignment="center">
      <Button modifiers={[buttonStyle('borderless')]} onPress={openProduct}>
        <Text modifiers={[lineLimit(1), truncationMode('tail')]}>
          {product.name}
        </Text>
      </Button>
      <Spacer />
      <Button
        label="Edit"
        modifiers={[buttonStyle('borderless')]}
        onPress={editProduct}
      />
    </HStack>
  );
}

type CatalogueContentProps = {
  products: Product[] | undefined;
  sections: ProductSection[];
  query: string;
  error: string | null;
};

function CatalogueContent({
  products,
  sections,
  query,
  error,
}: CatalogueContentProps) {
  if (products === undefined) return <ProgressView />;

  if (error) {
    return (
      <List>
        <Section title="Could not load catalogue">
          <Text>{error}</Text>
        </Section>
      </List>
    );
  }

  if (sections.length === 0) {
    return (
      <List>
        <Section>
          <Text>
            {query.trim()
              ? 'No products match your search.'
              : 'No products in the catalogue yet.'}
          </Text>
        </Section>
      </List>
    );
  }

  return (
    <List>
      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </Section>
      ))}
    </List>
  );
}

export default function SearchIndex() {
  const [products, setProducts] = useState<Product[]>();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      getProducts()
        .then((result) => {
          if (!cancelled) {
            setProducts(result);
            setError(null);
          }
        })
        .catch((cause) => {
          if (!cancelled) {
            setProducts([]);
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not load the catalogue.'
            );
          }
        });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const sections = useMemo<ProductSection[]>(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const visibleProducts = (products ?? []).filter((product) =>
      product.name.toLocaleLowerCase().includes(normalizedQuery)
    );
    const grouped = new Map<string, Product[]>();

    for (const product of visibleProducts) {
      const title = sectionTitle(product.name);
      const section = grouped.get(title) ?? [];
      section.push(product);
      grouped.set(title, section);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([title, sectionProducts]) => ({
        title,
        products: sectionProducts,
      }));
  }, [products, query]);

  return (
    <>
      <Stack.Title>Product catalogue</Stack.Title>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search catalogue"
        autoCapitalize="none"
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <Host style={{ flex: 1 }}>
        <CatalogueContent
          products={products}
          sections={sections}
          query={query}
          error={error}
        />
      </Host>
    </>
  );
}
