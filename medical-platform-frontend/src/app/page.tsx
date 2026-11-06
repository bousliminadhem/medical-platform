import { redirect } from "next/navigation";

// Root "/" → redirect to login. Once logged in the AuthContext handles role routing.
export default function RootPage() {
  redirect("/login");
}

