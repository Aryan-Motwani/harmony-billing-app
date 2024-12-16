import { TagIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';
import { GROUPS } from '../../constants';

export const priceType = defineType({
  name: 'price',
  title: 'Price',
  type: 'document',
  icon: TagIcon,
  groups: GROUPS,
  fields: [
    // Trampoline field with an array of prices
    defineField({
      name: 'trampoline',
      title: 'Trampoline Prices',
      type: 'array',
      of: [{ type: 'number' }], // Array of numbers to store multiple prices
      validation: Rule => Rule.min(1).required(),
    }),

    // Softplay field with a single price
    defineField({
      name: 'softplay',
      title: 'Softplay Price',
      type: 'number',
      validation: Rule => Rule.required(),
    }),

    // Socks field with sizes and prices
    defineField({
      name: 'socks',
      title: 'Socks Pricing',
      type: 'object',
      fields: [
        { name: 'XS', type: 'number', title: 'XS Price' },
        { name: 'S', type: 'number', title: 'S Price' },
        { name: 'M', type: 'number', title: 'M Price' },
        { name: 'L', type: 'number', title: 'L Price' },
        { name: 'XL', type: 'number', title: 'XL Price' },
      ],
      validation: Rule => Rule.required(),
    }),
  ],
});
