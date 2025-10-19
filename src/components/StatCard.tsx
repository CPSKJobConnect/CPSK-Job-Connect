import { IconType } from "react-icons/lib";

interface StatCardProps {
    title: string;
    value: string;
    icon: IconType;
    iconBg: string;
    iconColor: string;
}

const StatCard = ({ title, value, icon: Icon, iconBg, iconColor}: StatCardProps) => {
    return (
      <div className="rounded-md shadow-md p-3 w-full flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <p className="text-gray-700 font-bold text-md">{title}</p>
            <p className="text-gray-700 font-bold text-3xl">{value}</p>
          </div>
          <div className={`rounded-full p-2`} style={{ backgroundColor: iconBg, color: iconColor }}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };
export default StatCard;
  