import {
  Wheat,
  Factory,
  Snowflake,
  Waves,
  Landmark,
  Sprout,
  UtensilsCrossed,
  Building2,
  Mountain,
  MapPin,
  Globe,
} from '../icons/lucide';

/**
 * ZoneIcon component - monochrome icons for economic regions
 * Replaces colored emojis with monochrome SVG icons
 */
export default function ZoneIcon({ zoneId, size = 18, className = '' }) {
  const iconProps = {
    size,
    className: `text-current ${className}`,
  };

  const iconMap = {
    east_euro_agrarian: <Wheat {...iconProps} />,
    west_eu_industrial: <Factory {...iconProps} />,
    northern_import: <Snowflake {...iconProps} />,
    mediterranean: <Waves {...iconProps} />,
    north_american: <Landmark {...iconProps} />,
    latam_agrarian: <Sprout {...iconProps} />,
    asian_rice_labor: <UtensilsCrossed {...iconProps} />,
    developed_asia: <Building2 {...iconProps} />,
    mena_arid: <Mountain {...iconProps} />,
    oceanic: <MapPin {...iconProps} />,
    subsaharan_subsistence: <Globe {...iconProps} />,
  };

  return iconMap[zoneId] || <Globe {...iconProps} />;
}

