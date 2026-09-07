import { SettingsEditor } from "@/components/admin/settings-editor";
import { getSiteSettings } from "@/lib/queries";
export default async function SettingsPage(){const settings=await getSiteSettings(true);return <div className="admin-page"><SettingsEditor settings={settings}/></div>}
