import { TagIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';
import { GROUPS } from '../../constants';

export const ticketType = defineType({
  name: 'ticket',
  title: 'Ticket',
  type: 'document',
  icon: TagIcon,
  groups: GROUPS,
  fields: [
    // Customer's Name
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Customer name is required'),
    }),

    // Customer's Phone Number
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      
    }),

    // Array of People with dynamic names and optional signatures
    defineField({
      name: 'people',
      title: 'People',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
          
            },
            {
              name: 'signature',
              title: 'Signature (Optional)',
              type: 'string', // Store signature as an image
            },
          ],
        },
      ],
    }),

    // Duration of the Session
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      options: {
        list: ['30 min', '60 min', '90 min'], // Dropdown options
      },
      validation: (Rule) => Rule.required().error('Duration is required'),
    }),

    // Bill Amount
    defineField({
      name: 'totalAmount',
      title: 'Total Amount',
      type: 'number',
      validation: (Rule) => Rule.min(0).error('Amount must be positive'),
    }),

    // Date of Ticket Creation
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(), // Automatically set the current timestamp
    }),
  ],
});
