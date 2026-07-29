import ApolloLinkTimeout from "apollo-link-timeout";

// Timeout: 30s (increased from 10s for device registration)
const timeoutLink = new ApolloLinkTimeout(30000);

export default timeoutLink;
