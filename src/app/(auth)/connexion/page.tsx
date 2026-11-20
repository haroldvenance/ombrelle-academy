import LoginForm from "./LoginForm";
export default function Page({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return <LoginForm next={searchParams.next ?? "/dashboard"} error={searchParams.error} />;
}
