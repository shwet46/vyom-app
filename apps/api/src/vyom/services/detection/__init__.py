"""Growth and advisory detection services."""

from vyom.services.detection.churn import ChurnDetector
from vyom.services.detection.dead_hours import DeadHoursDetector
from vyom.services.detection.falling_sales import FallingSalesDetector
from vyom.services.detection.festival_opps import FestivalOpportunityGenerator

__all__ = [
    "ChurnDetector",
    "DeadHoursDetector",
    "FallingSalesDetector",
    "FestivalOpportunityGenerator",
]
