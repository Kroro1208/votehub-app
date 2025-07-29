// export const RouteAccess = {
//   PUBLIC: "public",
//   PROTECTED: "protected",
// } as const;

// export type RouteAccess = (typeof RouteAccess)[keyof typeof RouteAccess];

// export class RouteDefinition {
//   constructor(
//     public path: string,
//     public component: () => Promise<{ default: React.ComponentType }>,
//     public access: RouteAccess,
//     public requiresAuth: boolean = false,
//   ) {}
// }

// export class AppRoutes {
//   static readonly PUBLIC_ROUTES = [
//     new RouteDefinition("/", () => import("../pages/Home"), RouteAccess.PUBLIC),
//     new RouteDefinition(
//       "/trending",
//       () => import("../pages/PopularVotesPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/results",
//       () => import("../pages/VoteResultsPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/space",
//       () => import("../pages/CommunitiesPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/space/:id",
//       () => import("../pages/CommunityDetailPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/post/:id",
//       () => import("../pages/PostPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/tags/:tagId/posts",
//       () => import("../pages/TagPostsPage"),
//       RouteAccess.PUBLIC,
//     ),
//     new RouteDefinition(
//       "/user-ranking",
//       () => import("../pages/UserRankingPage"),
//       RouteAccess.PUBLIC,
//     ),
//   ];
//   static readonly PROTECTED_ROUTES = [
//     new RouteDefinition(
//       "/create",
//       () => import("../pages/CreatePostPage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/bookmarks",
//       () => import("../pages/BookmarksPage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/space/create",
//       () => import("../pages/CreateCommunityPage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/profile",
//       () => import("../pages/ProfilePage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/profile/:userId",
//       () => import("../pages/ProfilePage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/notifications",
//       () => import("../pages/NotificationsPage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//     new RouteDefinition(
//       "/settings",
//       () => import("../pages/SettingsPage"),
//       RouteAccess.PROTECTED,
//       true,
//     ),
//   ];
//   static getAllRoutes(): RouteDefinition[] {
//     return [...this.PUBLIC_ROUTES, ...this.PROTECTED_ROUTES];
//   }
// }
