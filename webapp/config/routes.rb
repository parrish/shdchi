Webapp::Application.routes.draw do
  root to: 'application#index'
  match '/upload' => 'application#upload'
end
