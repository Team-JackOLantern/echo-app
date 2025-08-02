import { Svg, Path } from "react-native-svg";
import { IconProps } from "@/types/icon";

const StatisticsIcon = ({ fill = "#696969" }: IconProps) => {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
                d="M7 13V19H5V13H7ZM13 5V19H11V5H13ZM19 10V19H17V10H19Z"
                stroke={fill}
                strokeWidth={2}
            />
        </Svg>
    );
};

export default StatisticsIcon;