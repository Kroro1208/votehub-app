# コードスタイル＆規約

## TypeScript設定

- **Strict Mode**: 全て有効
- **Import Alias**: `@/*` for `./src/*`
- 厳格な型チェック: noImplicitAny, noImplicitReturns, exactOptionalPropertyTypes等

## コードスタイル

- **Naming**: camelCase for variables/functions, PascalCase for components
- **File Structure**: Feature-based組織 (`components/Feature/`, `hooks/`, `utils/`)
- **Import Order**: External libraries → Internal modules → Relative imports
- **Component Pattern**: Function components with TypeScript interfaces

## コンポーネント規約

- **Props Interface**: コンポーネント名 + `Props` (例: `TagSectionProps`)
- **Export**: default export for components
- **Type Definitions**: 別ファイルまたはコンポーネント上部で定義
- **Hook Pattern**: `use` prefix, custom hooks in `hooks/` directory

## スタイリング規約

- **Tailwind Classes**: ユーティリティ優先
- **Dark Mode**: class-based (`dark:` prefix)
- **Responsive**: モバイルファースト
- **Custom Colors**: dark theme colors defined in tailwind.config.js

## 日本語対応

- **UI Text**: 多言語対応フック `useLanguage()` 使用
- **Comments**: 日本語コメント可
- **Variable Names**: 英語推奨、日本語文脈理解重要
