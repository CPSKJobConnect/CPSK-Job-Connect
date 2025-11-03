export interface ApplicationTrendChartProps {
  data: TrendDataPoint[];
  loading: boolean;
}

interface TrendDataPoint {
  date: string;
  applications: number;
}

export interface RecentApplicationsTableProps {
	applications: Application[];
	loading: boolean;
}

interface Application {
	id: string;
	applicant: {
		id: string;
    name: string;
		email: string;
		profile_url: string;
	};
	job: {
		id: string;
		title: string;
	};
	status: string;
	applied_at: string;
}

 export interface StatusBreakdownChartProps {
  data: StatusBreakdown | null;
  loading: boolean;
}

interface StatusBreakdown {
  pending: number;
  reviewed: number;
  interviewed: number;
  accepted: number;
  rejected: number;
}

export interface TopJobsCardProps {
  jobs: TopJob[];
  loading: boolean;
}

interface TopJob {
  id: string;
  title: string;
  applications: number;
  status: string;
}