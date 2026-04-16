-- Normalizar pais_nacimiento a códigos ISO en personas existentes
-- Cubre las variantes detectadas: COLOMBIA/Colombia/CO, VENEZUELA/Venezuela/VE, República Dominicana, etc.

UPDATE public.personas SET pais_nacimiento = 'CO'
  WHERE upper(trim(pais_nacimiento)) IN ('COLOMBIA','CO');
UPDATE public.personas SET pais_nacimiento = 'VE'
  WHERE upper(trim(pais_nacimiento)) IN ('VENEZUELA','VE');
UPDATE public.personas SET pais_nacimiento = 'EC'
  WHERE upper(trim(pais_nacimiento)) IN ('ECUADOR','EC');
UPDATE public.personas SET pais_nacimiento = 'PE'
  WHERE upper(trim(pais_nacimiento)) IN ('PERU','PERÚ','PE');
UPDATE public.personas SET pais_nacimiento = 'BR'
  WHERE upper(trim(pais_nacimiento)) IN ('BRASIL','BRAZIL','BR');
UPDATE public.personas SET pais_nacimiento = 'AR'
  WHERE upper(trim(pais_nacimiento)) IN ('ARGENTINA','AR');
UPDATE public.personas SET pais_nacimiento = 'CL'
  WHERE upper(trim(pais_nacimiento)) IN ('CHILE','CL');
UPDATE public.personas SET pais_nacimiento = 'MX'
  WHERE upper(trim(pais_nacimiento)) IN ('MEXICO','MÉXICO','MX');
UPDATE public.personas SET pais_nacimiento = 'PA'
  WHERE upper(trim(pais_nacimiento)) IN ('PANAMA','PANAMÁ','PA');
UPDATE public.personas SET pais_nacimiento = 'CR'
  WHERE upper(trim(pais_nacimiento)) IN ('COSTA RICA','CR');
UPDATE public.personas SET pais_nacimiento = 'BO'
  WHERE upper(trim(pais_nacimiento)) IN ('BOLIVIA','BO');
UPDATE public.personas SET pais_nacimiento = 'PY'
  WHERE upper(trim(pais_nacimiento)) IN ('PARAGUAY','PY');
UPDATE public.personas SET pais_nacimiento = 'UY'
  WHERE upper(trim(pais_nacimiento)) IN ('URUGUAY','UY');
UPDATE public.personas SET pais_nacimiento = 'GT'
  WHERE upper(trim(pais_nacimiento)) IN ('GUATEMALA','GT');
UPDATE public.personas SET pais_nacimiento = 'HN'
  WHERE upper(trim(pais_nacimiento)) IN ('HONDURAS','HN');
UPDATE public.personas SET pais_nacimiento = 'SV'
  WHERE upper(trim(pais_nacimiento)) IN ('EL SALVADOR','SV');
UPDATE public.personas SET pais_nacimiento = 'NI'
  WHERE upper(trim(pais_nacimiento)) IN ('NICARAGUA','NI');
UPDATE public.personas SET pais_nacimiento = 'CU'
  WHERE upper(trim(pais_nacimiento)) IN ('CUBA','CU');
UPDATE public.personas SET pais_nacimiento = 'DO'
  WHERE upper(trim(pais_nacimiento)) IN ('REPUBLICA DOMINICANA','REPÚBLICA DOMINICANA','DO');
UPDATE public.personas SET pais_nacimiento = 'PR'
  WHERE upper(trim(pais_nacimiento)) IN ('PUERTO RICO','PR');
UPDATE public.personas SET pais_nacimiento = 'US'
  WHERE upper(trim(pais_nacimiento)) IN ('ESTADOS UNIDOS','USA','EEUU','EE.UU.','EE. UU.','UNITED STATES','US');
UPDATE public.personas SET pais_nacimiento = 'CA'
  WHERE upper(trim(pais_nacimiento)) IN ('CANADA','CANADÁ','CA');
UPDATE public.personas SET pais_nacimiento = 'ES'
  WHERE upper(trim(pais_nacimiento)) IN ('ESPANA','ESPAÑA','SPAIN','ES');
UPDATE public.personas SET pais_nacimiento = 'FR'
  WHERE upper(trim(pais_nacimiento)) IN ('FRANCIA','FRANCE','FR');
UPDATE public.personas SET pais_nacimiento = 'DE'
  WHERE upper(trim(pais_nacimiento)) IN ('ALEMANIA','GERMANY','DE');
UPDATE public.personas SET pais_nacimiento = 'IT'
  WHERE upper(trim(pais_nacimiento)) IN ('ITALIA','ITALY','IT');
UPDATE public.personas SET pais_nacimiento = 'PT'
  WHERE upper(trim(pais_nacimiento)) IN ('PORTUGAL','PT');
UPDATE public.personas SET pais_nacimiento = 'GB'
  WHERE upper(trim(pais_nacimiento)) IN ('REINO UNIDO','UNITED KINGDOM','UK','GB');
UPDATE public.personas SET pais_nacimiento = 'NL'
  WHERE upper(trim(pais_nacimiento)) IN ('PAISES BAJOS','PAÍSES BAJOS','HOLANDA','NETHERLANDS','NL');
UPDATE public.personas SET pais_nacimiento = 'BE'
  WHERE upper(trim(pais_nacimiento)) IN ('BELGICA','BÉLGICA','BELGIUM','BE');
UPDATE public.personas SET pais_nacimiento = 'CH'
  WHERE upper(trim(pais_nacimiento)) IN ('SUIZA','SWITZERLAND','CH');
UPDATE public.personas SET pais_nacimiento = 'AT'
  WHERE upper(trim(pais_nacimiento)) IN ('AUSTRIA','AT');
UPDATE public.personas SET pais_nacimiento = 'SE'
  WHERE upper(trim(pais_nacimiento)) IN ('SUECIA','SWEDEN','SE');
UPDATE public.personas SET pais_nacimiento = 'NO'
  WHERE upper(trim(pais_nacimiento)) IN ('NORUEGA','NORWAY','NO');
UPDATE public.personas SET pais_nacimiento = 'DK'
  WHERE upper(trim(pais_nacimiento)) IN ('DINAMARCA','DENMARK','DK');
UPDATE public.personas SET pais_nacimiento = 'FI'
  WHERE upper(trim(pais_nacimiento)) IN ('FINLANDIA','FINLAND','FI');
UPDATE public.personas SET pais_nacimiento = 'PL'
  WHERE upper(trim(pais_nacimiento)) IN ('POLONIA','POLAND','PL');
UPDATE public.personas SET pais_nacimiento = 'IE'
  WHERE upper(trim(pais_nacimiento)) IN ('IRLANDA','IRELAND','IE');
UPDATE public.personas SET pais_nacimiento = 'CN'
  WHERE upper(trim(pais_nacimiento)) IN ('CHINA','CN');
UPDATE public.personas SET pais_nacimiento = 'JP'
  WHERE upper(trim(pais_nacimiento)) IN ('JAPON','JAPÓN','JAPAN','JP');
UPDATE public.personas SET pais_nacimiento = 'KR'
  WHERE upper(trim(pais_nacimiento)) IN ('COREA DEL SUR','COREA','SOUTH KOREA','KOREA','KR');
UPDATE public.personas SET pais_nacimiento = 'IN'
  WHERE upper(trim(pais_nacimiento)) IN ('INDIA','IN');
UPDATE public.personas SET pais_nacimiento = 'AU'
  WHERE upper(trim(pais_nacimiento)) IN ('AUSTRALIA','AU');
UPDATE public.personas SET pais_nacimiento = 'NZ'
  WHERE upper(trim(pais_nacimiento)) IN ('NUEVA ZELANDA','NEW ZEALAND','NZ');
UPDATE public.personas SET pais_nacimiento = 'ZA'
  WHERE upper(trim(pais_nacimiento)) IN ('SUDAFRICA','SUDÁFRICA','SOUTH AFRICA','ZA');
UPDATE public.personas SET pais_nacimiento = 'EG'
  WHERE upper(trim(pais_nacimiento)) IN ('EGIPTO','EGYPT','EG');
UPDATE public.personas SET pais_nacimiento = 'MA'
  WHERE upper(trim(pais_nacimiento)) IN ('MARRUECOS','MOROCCO','MA');