// src/sanityClient.js
import sanityClient from '@sanity/client';

const client = sanityClient({
  projectId: 'iylj6s7q', // Find this in your Sanity.io project settings
  dataset: 'production', // Replace with your dataset name
  apiVersion: '2023-01-01', // Use a specific date for the API version
  useCdn: true, // `false` if you want fresh data
  token:'sk1D0awlZqfGNnhH7xqLdJSCeQJbJhObOcPqyOyEtVabYC6szaThuxLhg4O20hZqFWiKk3vVDhDKuqSl7wkxKzPIKvRP8UocEjiJerUApffW8XeuWHM3FY9kHTmvNLaNfOkIBHCBywiIALl7omri6qK0LYX6EBjgNI3vNd8U3SG5j5pROygi'
});

export default client;
